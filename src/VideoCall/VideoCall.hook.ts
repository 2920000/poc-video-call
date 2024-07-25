import OT from "@opentok/client";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

type PublisherFeature = {
  camera: boolean;
  audio: boolean;
  shareScreen: boolean;
  isExistSharing?: boolean;
  liveTranscription?: boolean;
};

type VonageParams = {
  roomInfo: {
    appKey: string;
    sessionId: string;
    publisherName: string;
    token: string;
  };
  publisherTarget: string;
  publisherProperty: OT.PublisherProperties;
  subscriberTarget: string;
  subscriberProperty: OT.SubscriberProperties;
  shareScreenTarget: string;
  shareScreenProperty: OT.PublisherProperties;
  baseUrl: string;
};
export const useVonage = ({
  roomInfo,
  publisherTarget,
  subscriberTarget,
  publisherProperty,
  subscriberProperty,
  shareScreenProperty,
  shareScreenTarget,
  baseUrl,
}: VonageParams) => {
  const [publisherFeature, setPublisherFeature] = useState<PublisherFeature>({
    camera: true,
    audio: true,
    shareScreen: false,
    liveTranscription: false,
  });

  const [transcription, setTranscription] = useState<
    { name: string; text: string }[]
  >([]);

  const sessionRef = useRef<OT.Session>();
  const publisherRef = useRef<OT.Publisher>();
  const screenSharePublisherRef = useRef<OT.Publisher>();
  const captionIdRef = useRef<string>("");
  const mapNameRef = useRef<Record<string, string>>({});

  useEffect(() => {
    publisherRef?.current?.publishVideo(publisherFeature.camera);
    publisherRef?.current?.publishAudio(publisherFeature.audio);
  }, [publisherFeature]);

  const initVonage = () => {
    const session = OT.initSession(roomInfo.appKey, roomInfo.sessionId);
    const publisher = OT.initPublisher(publisherTarget, publisherProperty);

    session.connect(roomInfo.token, function (connectError) {
      if (connectError) return;
      session.publish(publisher);
    });

    publisher.on("streamCreated", async () => {
      const publisherCaption = session.subscribe(
        publisher.stream as any,
        document.createElement("div"),
        {
          audioVolume: 0,
          testNetwork: true,
        }
      );
      publisherCaption.on("captionReceived", (event) => {
        if (event.isFinal) {
          setTranscription((prev) => [
            ...prev,
            { name: roomInfo.publisherName, text: event.caption },
          ]);
        }
      });

      // Start live caption when init succeed publisher
      try {
        const response = await fetch(`${baseUrl}/api/opentok/start-captions`, {
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({
            sessionId: roomInfo.sessionId,
            token: roomInfo.token,
          }),
        });
        const caption = await response.text();
        if (typeof caption === "string") {
          captionIdRef.current = JSON.parse(caption).captionsId;
        }
      } catch (error) {
        console.log(error);
      }
    });

    session.on("streamCreated", async function (event) {
      if (event.stream.videoType === "screen") {
        setPublisherFeature((prev) => ({ ...prev, isExistSharing: true }));
      }

      const streamCreatedTarget =
        event.stream.videoType === "screen" ? "screen" : subscriberTarget;

      const subscriber = session.subscribe(
        event.stream,
        streamCreatedTarget,
        subscriberProperty
      );

      await subscriber.subscribeToCaptions(true);

      subscriber.on("captionReceived", (event) => {
        if (event.isFinal) {
          setTranscription((prev) => [
            ...prev,
            { name: mapNameRef.current[event.streamId], text: event.caption },
          ]);
        }
      });
    });

    session.on("streamDestroyed", (event) => {
      if (event.stream.videoType === "screen") {
        setPublisherFeature((prev) => ({ ...prev, isExistSharing: false }));
      }
      if (event.stream.videoType === "camera") {
        const notify = () => toast(`${event.stream.name} out room`);
        notify();
      }
    });

    publisherRef.current = publisher;
    sessionRef.current = session;
  };

  const handleEndCall = () => {
    setTranscription([]);
    mapNameRef.current = {};
    sessionRef.current?.disconnect();
    sessionRef.current?.off("streamCreated");
    setPublisherFeature({ audio: true, camera: true, shareScreen: false });
  };

  const handleSharingScreen = async () => {
    setPublisherFeature((prev) => ({
      ...prev,
      shareScreen: !prev.shareScreen,
    }));
    if (publisherFeature.shareScreen) {
      screenSharePublisherRef.current?.destroy();
      return;
    }
    OT.checkScreenSharingCapability((response) => {
      if (!response.supported || response.extensionRegistered === false) {
        alert("Screen sharing not supported");
      } else if (response.extensionInstalled === false) {
        alert("Browser requires extension");
      } else {
        const screenSharePublisher = OT.initPublisher(
          shareScreenTarget,
          shareScreenProperty,
          (err) => {
            if (err) {
              setPublisherFeature((prev) => ({ ...prev, shareScreen: false }));
            }
          }
        );
        screenSharePublisher.on("mediaStopped", () => {
          setPublisherFeature((prev) => ({ ...prev, shareScreen: false }));
        });
        screenSharePublisherRef.current = screenSharePublisher;
        sessionRef?.current?.publish(screenSharePublisher);
      }
    });
  };

  return {
    initVonage,
    setPublisherFeature,
    publisherFeature,
    setTranscription,
    transcription,
    handleEndCall,
    handleSharingScreen,
    screenSharePublisherRef,
    captionIdRef,
    sessionRef,
  };
};
