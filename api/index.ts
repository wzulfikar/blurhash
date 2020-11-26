import * as blurhash from "blurhash";
import { createCanvas, loadImage, Image } from "canvas";
import cache from "memory-cache";

const getImageData = (image: Image) => {
  const canvas = createCanvas(image.width, image.height);
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0);
  return context.getImageData(0, 0, image.width, image.height);
};

export default async (req, res) => {
  const imgUrl = req.query.image;

  const cacheKey = `blurhash:${Buffer.from(imgUrl).toString("base64")}`;

  const cachedValue = cache.get(cacheKey);
  if (cachedValue) {
    res.send({ blurhash: cachedValue });
    return;
  }

  console.log("[INFO] creating blurhash encode for", imgUrl);

  const image = await loadImage(imgUrl);
  const imageData = getImageData(image);

  const blurhashEncode = blurhash.encode(
    imageData.data,
    imageData.width,
    imageData.height,
    4,
    4
  );

  // We assume that content of image url is immutable.
  // Thus, it's safe to store the cache for a long time.
  // And because the code operates in serverless environment,
  // the cache will automatically get released when the server changes.
  cache.put(cacheKey, blurhashEncode, 3600);

  res.send({
    blurhash: blurhashEncode,
  });
};
