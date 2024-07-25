import styled from "@emotion/styled";
import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";
import MicOffOutlinedIcon from "@mui/icons-material/MicOffOutlined";
import MicOutlinedIcon from "@mui/icons-material/MicOutlined";
import MoreHorizOutlinedIcon from "@mui/icons-material/MoreHorizOutlined";
import NoPhotographyOutlinedIcon from "@mui/icons-material/NoPhotographyOutlined";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import PresentToAllOutlinedIcon from "@mui/icons-material/PresentToAllOutlined";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import StopScreenShareOutlinedIcon from "@mui/icons-material/StopScreenShareOutlined";
import { Box, Button, Stack } from "@mui/material";
import { FC, ReactElement, useEffect } from "react";
import { url } from "../url";
import { useVonage } from "./VideoCall.hook";

type VideoCallProps = {
  roomInfo: {
    appKey: string;
    token: string;
    sessionId: string;
    publisherName: string;
  };
  startCallVideo: boolean;
  setStartCallVideo: (value: boolean) => void;
  onTranscription?: (transcription: { name: string; text: string }[]) => void;
  baseUrl: string;
};
const VideoCall: FC<VideoCallProps> = (
  props
): ReactElement<any, any> | null => {
  const {
    roomInfo,
    setStartCallVideo,
    startCallVideo,
    baseUrl,
    onTranscription,
  } = props;

  const {
    initVonage,
    handleEndCall,
    setPublisherFeature,
    handleSharingScreen,
    publisherFeature,
    transcription,
    captionIdRef,
  } = useVonage({
    roomInfo,
    publisherTarget: "publisher",
    subscriberTarget: "subscriber",
    shareScreenTarget: "screen",
    publisherProperty: {
      insertMode: "replace",
      width: "153px",
      height: "94px",
      name: roomInfo.publisherName,
      showControls: false,
      publishCaptions: true,
    },
    subscriberProperty: {
      insertMode: "append",
      width: "640px",
      height: "390px",
    },
    shareScreenProperty: {
      insertMode: "append",
      width: "153px",
      height: "94px",
      videoSource: "screen",
      publishAudio: true,
    },
    baseUrl,
  });

  useEffect(() => {
    onTranscription?.(transcription);
  }, [transcription]);

  useEffect(() => {
    if (startCallVideo) {
      initVonage();
    }
  }, [startCallVideo]);

  const handleEndCallVideo = () => {
    handleEndCall();
    setStartCallVideo(false);
  };

  const handleLiveCaption = async () => {
    setPublisherFeature((prev) => ({
      ...prev,
      liveTranscription: !prev.liveTranscription,
    }));
    if (publisherFeature.liveTranscription) {
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
          sessionId: roomInfo.sessionId,
          token: roomInfo.token,
        }),
      });
      const caption = await response.text();
      if (typeof caption === "string") {
        captionIdRef.current = JSON.parse(caption).captionsId;
      }
    }
  };

  const handleVideoIconActions = (type: string) => {
    switch (type) {
      case "camera":
        setPublisherFeature((prev) => ({ ...prev, camera: !prev.camera }));
        break;
      case "mic":
        setPublisherFeature((prev) => ({ ...prev, audio: !prev.audio }));
        break;
      case "share":
        handleSharingScreen();
        break;
      case "caption":
        handleLiveCaption();
        break;
      case "options":
      default:
    }
  };

  const handleFullScreen = () => {
    const subscriber = document.querySelector("#subscriber") as HTMLElement;
    subscriber.requestFullscreen();
    subscriber.style.width = "100%";
    subscriber.style.height = "100%";
  };

  const renderLiveCaptionBtn = () => {
    if (publisherFeature.liveTranscription) {
      return <StopCircleIcon width={"16px"} height="16px" />;
    }
    return <PlayCircleOutlineIcon width={"16px"} height="16px" />;
  };

  const renderCameraBtn = () => {
    if (publisherFeature.camera) {
      return <CameraAltOutlinedIcon width={"16px"} height="16px" />;
    }
    return <NoPhotographyOutlinedIcon width={"16px"} height="16px" />;
  };

  const renderMicBtn = () => {
    if (publisherFeature.audio) {
      return <MicOutlinedIcon width={"16px"} height="16px" />;
    }
    return <MicOffOutlinedIcon width={"16px"} height="16px" />;
  };

  const renderShareScreenBtn = () => {
    if (publisherFeature.shareScreen) {
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
      isActive: publisherFeature.camera,
    },
    {
      type: "mic",
      icon: renderMicBtn(),
      isActive: publisherFeature.audio,
    },
    {
      type: "share",
      icon: renderShareScreenBtn(),
      isActive: publisherFeature.shareScreen,
    },
    {
      type: "caption",
      icon: renderLiveCaptionBtn(),
      isActive: publisherFeature.liveTranscription,
    },
    { type: "options", icon: <MoreHorizOutlinedIcon />, isActive: false },
  ];

  return (
    <StyledVideoContainer className="videos">
      {/* <StyledVideoCallActionBar>
        <RadioButtonCheckedOutlinedIcon />
        <IconButton onClick={handleFullScreen}>
          <FullscreenOutlinedIcon />
        </IconButton>
      </StyledVideoCallActionBar> */}
      <StyledVideoCall>
        <StyledSharingScreen
          isPublisherShare={publisherFeature.shareScreen}
          id="screen"
        ></StyledSharingScreen>
        <StyledPublisher id="publisher"></StyledPublisher>
        <StyledSubscriber
          isPublisherShare={publisherFeature.shareScreen}
          isExistSharing={publisherFeature.isExistSharing}
          id="subscriber"
        ></StyledSubscriber>
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
  );
};

export default VideoCall;

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

const StyledEndCall = styled(Box)``;

const StyledVideoCallActionBar = styled(Box)`
  position: absolute;
  top: 24px;
  left: 24px;
  z-index: 99999;
  width: 616px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: white;
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
