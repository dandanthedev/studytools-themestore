// Parent component
import { useEffect, useRef } from "react";

export default function Parent({ style }: { style: Record<string, string> }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      setTimeout(() => {
        iframeRef.current?.contentWindow?.postMessage({ style }, "*");
      }, 1000);
    }
  }, [style, iframeRef]);

  return <iframe ref={iframeRef} src="/preview" className="w-full h-full" />;
}
