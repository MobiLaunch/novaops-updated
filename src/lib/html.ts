import DOMPurify from "dompurify";

/** iFixit returns rendered HTML; sanitize before injecting. */
export const safeHtml = (html: string) => ({ __html: DOMPurify.sanitize(html || "", { ADD_ATTR: ["target"] }) });
