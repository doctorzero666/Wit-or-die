import { readFile } from "fs/promises";

const IMAGE_PATH =
  "/Users/zhichaojiang/.cursor/projects/Users-zhichaojiang-Documents-web3/assets/image-5b58c54b-6f96-4a9a-8b45-905b8bac6de5.png";

export async function GET() {
  try {
    const buffer = await readFile(IMAGE_PATH);
    return new Response(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store"
      }
    });
  } catch {
    return new Response("Not Found", { status: 404 });
  }
}
