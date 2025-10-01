import {getAuctionByID} from "./getAuctionByID";
import {uploadPictureToS3} from "../lib/uploadPictureToS3";
import httpErrorHandler from "@middy/http-error-handler";
import middy from "@middy/core";
import validator from "@middy/validator";
import createError from "http-errors";
import {setAuctionPictureUrl} from "../lib/setAuctionPictureUrl";
import uploadAuctionPictureSchema from "../lib/schemas/uploadAuctionPictureSchema";

export async function uploadAuctionPicture(event) {
    const { id } = event.pathParameters;
    const { email } = event.requestContext.authorizer;
    const auction = await getAuctionByID(id);

    if (auction.seller !== email) {
        throw new createError.HTTP_STATUS_FORBIDDEN(`Cannot upload picture to auctions that are not yours!`)
    }

    const base64 = event.body.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64, 'base64')

    let updatedAuction;

    try {
        const pictureUrl = await uploadPictureToS3(auction.id + '.jpg', buffer);
        updatedAuction = await setAuctionPictureUrl(auction.id, pictureUrl);
        console.log(pictureUrl);
    } catch (error) {
        console.log(error);
        throw new createError.HTTP_STATUS_INTERNAL_SERVER_ERROR(error)
    }

    return {
        statusCode: 200,
        body: JSON.stringify(updatedAuction),
    };
}

export const handler = middy(uploadAuctionPicture)
    .use(httpErrorHandler())
    .use(validator({ inputSchema: uploadAuctionPictureSchema }));