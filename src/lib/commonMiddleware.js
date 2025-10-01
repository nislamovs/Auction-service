import httpEventNormalizer from "@middy/http-event-normalizer";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import httpErrorHandler from "@middy/http-error-handler";
import middy from "@middy/core";
import cors from "@middy/http-cors";

export default handler => middy(handler)
    .use([
        httpEventNormalizer(),
        httpJsonBodyParser(),
        httpErrorHandler(),
        cors(),
        ]);