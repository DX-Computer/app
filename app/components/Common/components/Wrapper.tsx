import { JSX } from "react";

export default function Wrapper({
  page,
}: {
  page: JSX.Element;
}) {
  return (
    <>
      <div
        className="min-h-full h-auto min-w-screen w-screen relative selection:bg-skyBlue selection:text-dull cursor-blacksmithS overflow-x-hidden flex flex-col"
        id="noScroll"
      >
        {page}
      </div>{" "}
    </>
  );
}
