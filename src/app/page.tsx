import { Blob1, Blob2, Blob3, Blob4 } from "./Blobs";

export default function Home() {
  return (
    <div className="grid grid-cols-4 h-1/2">
      <Blob1 />
      <Blob2 />
      <Blob3 />
      <Blob4 />
    </div>
  );
}
