
import React from "react";
import ScheduleUpload from "./ScheduleUpload";
import SchedulePreview from "./SchedulePreview";

export default function ScheduleImport({
  uploadProps = {},
  previewProps = {},
}) {
  return (
    <>
      <ScheduleUpload {...uploadProps} />

      {previewProps.importPreview?.length > 0 && (
        <SchedulePreview {...previewProps} />
      )}
    </>
  );
}
