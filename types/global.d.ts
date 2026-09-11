import React from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          "ios-src"?: string;
          poster?: string;
          alt?: string;
          ar?: boolean | string;
          "ar-modes"?: string;
          "ar-scale"?: string;
          "camera-controls"?: boolean | string;
          "touch-action"?: string;
          "auto-rotate"?: boolean | string;
          "shadow-intensity"?: string;
          "shadow-softness"?: string;
          exposure?: string;
          loading?: string;
          reveal?: string;
          "environment-image"?: string;
          "camera-orbit"?: string;
          slot?: string;
          ref?: any;
        },
        HTMLElement
      >;
    }
  }
}
