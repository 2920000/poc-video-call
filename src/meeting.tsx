import styled from "@emotion/styled";
import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";
import FullscreenOutlinedIcon from "@mui/icons-material/FullscreenOutlined";
import MicOffOutlinedIcon from "@mui/icons-material/MicOffOutlined";
import MicOutlinedIcon from "@mui/icons-material/MicOutlined";
import MoreHorizOutlinedIcon from "@mui/icons-material/MoreHorizOutlined";
import NoPhotographyOutlinedIcon from "@mui/icons-material/NoPhotographyOutlined";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import PresentToAllOutlinedIcon from "@mui/icons-material/PresentToAllOutlined";
import RadioButtonCheckedOutlinedIcon from "@mui/icons-material/RadioButtonCheckedOutlined";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import StopScreenShareOutlinedIcon from "@mui/icons-material/StopScreenShareOutlined";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import OT from "@opentok/client";
import { FC, ReactElement, useEffect, useRef, useState } from "react";
import { url } from "./url";
type MeetingV2Props = {
  appKey: string;
  token: string;
  sessionId: string;
  name: string;
  startCallVideo: boolean;
  setStartCallVideo: (value: boolean) => void;
};
const MeetingV2: FC<MeetingV2Props> = ({
  appKey,
  sessionId,
  token,
  name,
  setStartCallVideo,
  startCallVideo,
}): ReactElement<any, any> | null => {
  const [publisherMode, setPublisherMode] = useState<{
    camera: boolean;
    audio: boolean;
    shareScreen: boolean;
    isExistSharing?: boolean;
    startLiveTranscription?: boolean;
  }>({
    camera: true,
    audio: true,
    shareScreen: false,
    startLiveTranscription: false,
  });
  const [subscriberLoading, setSubscriberLoading] = useState<boolean>(true);
  const [transcription, setTranscription] = useState<
    { name: string; text: string }[]
  >([]);
  const subscribersRef = useRef<OT.Subscriber[]>([]);
  const sessionRef = useRef<OT.Session>();
  const publisherRef = useRef<OT.Publisher>();
  const screenSharePublisherRef = useRef<OT.Publisher>();
  const captionIdRef = useRef<string>("");
  const mapNameRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!startCallVideo) return;
    setSubscriberLoading(true);
    const session = OT.initSession(appKey, sessionId);

    session.connect(token, function (err) {
      const publisher = OT.initPublisher(
        "publisher",
        {
          insertMode: "replace",
          width: "153px",
          height: "94px",
          name,
          showControls: false,
          publishCaptions: true,
        },
        (connectError) => {
          if (connectError) return;
          session.publish(publisher, (publishError) => {
            if (publishError) return;
            const captionOnlySub = session.subscribe(
              publisher.stream as any,
              document.createElement("div"),
              {
                audioVolume: 0,
                testNetwork: true,
              }
            );
            captionOnlySub.on("captionReceived", (event) => {
              if (event.isFinal) {
                setTranscription((prev) => [
                  ...prev,
                  { name, text: event.caption },
                ]);
              }
            });
            publisherRef.current = publisher;
          });
        }
      );
    });

    session.on("streamCreated", async function (event) {
      setSubscriberLoading(false);
      if (event.stream.videoType === "screen") {
        setPublisherMode((prev) => ({ ...prev, isExistSharing: true }));
      }
      mapNameRef.current[event.stream.streamId] = event.stream.name;
      const streamContainer =
        event.stream.videoType === "screen" ? "screen" : "subscriber";
      const subscriber = session.subscribe(event.stream, streamContainer, {
        insertMode: "append",
        width: "640px",
        height: "390px",
      });
      await subscriber.subscribeToCaptions(true);

      subscriber.on("captionReceived", (event) => {
        const speakerName = mapNameRef.current[event.streamId];
        if (event.isFinal) {
          setTranscription((prev) => [
            ...prev,
            { name: speakerName, text: event.caption },
          ]);
        }
      });
      // setSubscriber((prev) => [...prev, subscriber]);
      subscribersRef.current?.push(subscriber);
    });
    session.on("streamDestroyed", (event) => {
      if (event.stream.videoType === "screen") {
        setPublisherMode((prev) => ({ ...prev, isExistSharing: false }));
      }
      console.log(`${event.stream.name} out room` + event.stream.name);
    });

    sessionRef.current = session;
  }, [appKey, sessionId, token, startCallVideo, name]);

  useEffect(() => {
    publisherRef?.current?.publishVideo(publisherMode.camera);
    publisherRef?.current?.publishAudio(publisherMode.audio);
  }, [publisherMode]);

  const handleEndCallVideo = () => {
    if (publisherRef?.current) {
      sessionRef.current?.unpublish(publisherRef.current);
    }
    subscribersRef.current?.forEach((subscriber) => {
      sessionRef.current?.unsubscribe(subscriber);
    });
    setTranscription([]);
    subscribersRef.current = [];
    publisherRef.current = undefined;
    sessionRef.current?.disconnect();
    setPublisherMode({ audio: true, camera: true, shareScreen: false });
    setStartCallVideo(false);
  };

  const handleScreenSharing = () => {
    setPublisherMode((prev) => ({ ...prev, shareScreen: !prev.shareScreen }));
    if (publisherMode.shareScreen) {
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
          "screen",
          {
            insertMode: "append",
            width: "153px",
            height: "94px",
            videoSource: "screen",
            publishAudio: true,
          },
          (err) => {
            if (err) {
              setPublisherMode((prev) => ({ ...prev, shareScreen: false }));
            }
          }
        );
        screenSharePublisherRef.current = screenSharePublisher;
        sessionRef?.current?.publish(screenSharePublisher);
      }
    });
  };

  const handleLiveCaption = async () => {
    setPublisherMode((prev) => ({
      ...prev,
      startLiveTranscription: !prev.startLiveTranscription,
    }));
    if (publisherMode.startLiveTranscription) {
      await fetch(`${url}/api/opentok/stop-captions`, {
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          captionId: captionIdRef.current,
        }),
      });
    } else {
      const response = await fetch(`${url}/api/opentok/start-captions`, {
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          sessionId,
          token,
        }),
      });
      const caption = await response.text();
      if (typeof caption === "string") {
        captionIdRef.current = JSON.parse(caption).captionsId;
      }
    }
  };

  const handleDownload = async () => {
    const blob = new Blob(
      [
        ...transcription.map(
          (item) => `Name: ${item.name} \n Text: ${item.text} \n`
        ),
      ],
      {
        type: "text/plain",
      }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transcript.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleVideoIconActions = (type: string) => {
    switch (type) {
      case "camera":
        setPublisherMode((prev) => ({ ...prev, camera: !prev.camera }));
        break;
      case "mic":
        setPublisherMode((prev) => ({ ...prev, audio: !prev.audio }));
        break;

      case "share":
        handleScreenSharing();
        break;
      case "caption":
        handleLiveCaption();
        break;
      case "options":
      default:
    }
  };

  const handleFullScreen = () => {
    const subscriber = document.querySelector(".OT_subscriber ") as HTMLElement;
    //TODO : Need to confirm UI
  };

  const renderLiveCaptionBtn = () => {
    if (publisherMode.startLiveTranscription) {
      return <StopCircleIcon width={"16px"} height="16px" />;
    }
    return <PlayCircleOutlineIcon width={"16px"} height="16px" />;
  };

  const renderCameraBtn = () => {
    if (publisherMode.camera) {
      return <CameraAltOutlinedIcon width={"16px"} height="16px" />;
    }
    return <NoPhotographyOutlinedIcon width={"16px"} height="16px" />;
  };

  const renderMicBtn = () => {
    if (publisherMode.audio) {
      return <MicOutlinedIcon width={"16px"} height="16px" />;
    }
    return <MicOffOutlinedIcon width={"16px"} height="16px" />;
  };

  const renderShareScreenBtn = () => {
    if (publisherMode.shareScreen) {
      return <StopScreenShareOutlinedIcon />;
    }
    return <PresentToAllOutlinedIcon />;
  };

  if (!startCallVideo) {
    return <></>;
  }

  const videoIconActions = [
    {
      type: "camera",
      icon: renderCameraBtn(),
      isActive: publisherMode.camera,
    },
    {
      type: "mic",
      icon: renderMicBtn(),
      isActive: publisherMode.audio,
    },
    {
      type: "share",
      icon: renderShareScreenBtn(),
      isActive: publisherMode.shareScreen,
    },
    {
      type: "caption",
      icon: renderLiveCaptionBtn(),
      isActive: publisherMode.startLiveTranscription,
    },
    { type: "options", icon: <MoreHorizOutlinedIcon />, isActive: false },
  ];

  return (
    <Stack flexDirection={"row"} gap={2}>
      <StyledVideoContainer className="videos">
        <StyledActionBar>
          <RadioButtonCheckedOutlinedIcon />
          <IconButton onClick={handleFullScreen}>
            <FullscreenOutlinedIcon />
          </IconButton>
        </StyledActionBar>
        <StyledVideoCall>
          <StyledSharingScreen
            isPublisherShare={publisherMode.shareScreen}
            id="screen"
          ></StyledSharingScreen>
          <StyledPublisher id="publisher"></StyledPublisher>
          <StyledSubscriber
            isPublisherShare={publisherMode.shareScreen}
            isExistSharing={publisherMode.isExistSharing}
            id="subscriber"
          >
            <Box
              sx={{
                display: "flex",
                position: "absolute",
                top: "45%",
                left: "45%",
              }}
            >
              {subscriberLoading && <CircularProgress />}
            </Box>
          </StyledSubscriber>
        </StyledVideoCall>

        <StyledVideoAction>
          <Stack
            flexDirection={"row"}
            gap={2}
            justifyContent={"end"}
            width={"388px"}
            mr={"136px"}
          >
            {videoIconActions.map((action) => (
              <StyledInteractVideoBtn
                isActive={action.isActive}
                onClick={() => {
                  handleVideoIconActions(action.type);
                }}
              >
                {action.icon}
              </StyledInteractVideoBtn>
            ))}
          </Stack>
          <StyledEndCall onClick={handleEndCallVideo}>
            <Button
              variant="contained"
              sx={{
                width: "84px",
                height: "36px",
                padding: "8px 14px",
                borderRadius: "10px",
                textTransform: "none",
              }}
              color="error"
            >
              End Call
            </Button>
          </StyledEndCall>
        </StyledVideoAction>
      </StyledVideoContainer>
      <StyledLiveTranscript>
        <Stack
          flexDirection={"row"}
          justifyContent={"space-between"}
          alignItems={"center"}
          p={"16px 20px"}
        >
          <Typography>Transcript</Typography>
          <Button
            sx={{
              textTransform: "none",
            }}
            variant="outlined"
          >
            Live Transcript
          </Button>
        </Stack>
        <Divider />
        <StyledLiveTranscriptContent>
          {transcription.map((item) => (
            <Box mb={1}>
              <Typography variant="h6">{item.name}: </Typography>
              <Typography>{item.text}</Typography>
            </Box>
          ))}
        </StyledLiveTranscriptContent>
        <Divider />
        <Stack p={"16px 32px"} flexDirection={"row"} justifyContent={"end"}>
          <Button
            sx={{
              textTransform: "none",
            }}
            variant="outlined"
            onClick={handleDownload}
          >
            Download transcript
          </Button>
        </Stack>
      </StyledLiveTranscript>
    </Stack>
  );
};

export default MeetingV2;

const StyledLiveTranscript = styled(Box)`
  width: 389px;
  border-radius: 12px;
  border: 1px solid #b6b6b6;
`;

const StyledVideoContainer = styled(Box)`
  position: relative;
  /* width: 664px; */
  height: 475px;
  padding: 12px;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border: 1px solid #b6b6b6;
  border-radius: 12px;
`;

const StyledLiveTranscriptContent = styled(Box)`
  padding: 20px;
  overflow: auto;
  height: 350px;
`;

const StyledEndCall = styled(Box)``;

const StyledActionBar = styled(Box)`
  position: absolute;
  top: 24px;
  left: 24px;
  z-index: 99999;
  width: 616px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const StyledVideoCall = styled(Box)`
  position: relative;
  width: 640px;
  height: 390px;
`;

const StyledPublisher = styled(Box)`
  position: absolute;
  bottom: 12px;
  right: 12px;
  z-index: 99999;
  border-radius: 10px;
`;

const StyledVideoAction = styled(Box)`
  display: flex;
  align-items: center;
  padding: 16px;
  height: 64px;
  button {
    color: white;
  }
`;

const StyledSubscriber = styled(Box)<{
  isPublisherShare: boolean;
  isExistSharing?: boolean;
}>`
  height: ${(props) =>
    !props.isPublisherShare && props.isExistSharing ? "0" : "390px"};
  display: flex;
  gap: 10px;
  background-color: #000;
  border-radius: 8px;
  .OT_subscriber {
    border-radius: 8px;
    ${(props) => {
      return !props.isPublisherShare && props.isExistSharing
        ? "width: 100px!important; height: 100px!important;"
        : "";
    }};
  }
  ${(props) => {
    return !props.isPublisherShare && props.isExistSharing
      ? "position: absolute;top: 10px; right: 10px; height :fit-content;flex-direction: column;gap: 10px; background-color: inherit;"
      : "";
  }};
`;

const StyledInteractVideoBtn = styled(Box)<{ isActive?: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: ${(props) => (props.isActive ? "#0060ff" : "#DFEBFF")};
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  svg {
    width: 16px;
    height: 16px;
    color: ${(props) => (props.isActive ? "#fff" : "#0060FF")};
  }
`;

const StyledSharingScreen = styled(Box)<{ isPublisherShare: boolean }>`
  position: ${(props) => (props.isPublisherShare ? "absolute" : "block")};
  bottom: 12px;
  right: 200px;
  z-index: 99999;
  border-radius: 10px;
`;
