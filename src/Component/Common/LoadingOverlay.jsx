import React from "react";
import GlobalLoader from "./GlobalLoader";

/**
 * LoadingOverlay Component
 * Uses the Bondy brand GlobalLoader identical to the user web application.
 */
const LoadingOverlay = ({ isLoading = true, message = "" }) => {
  if (!isLoading) return null;

  return <GlobalLoader fullScreen={true} message={message} />;
};

export default LoadingOverlay;
