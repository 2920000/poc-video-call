import styled from "@emotion/styled";
import { Box, Button, Divider, Stack, Typography } from "@mui/material";
import { FC } from "react";

type TranscriptionProps = {
  transcription: { name: string; text: string }[];
};

const Transcription: FC<TranscriptionProps> = ({ transcription }) => {
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

  return (
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
  );
};

export default Transcription;

const StyledLiveTranscript = styled(Box)`
  width: 389px;
  border-radius: 12px;
  border: 1px solid #b6b6b6;
`;
const StyledLiveTranscriptContent = styled(Box)`
  padding: 20px;
  overflow: auto;
  height: 350px;
`;
