import { getEdDSAPublicKey } from "@pcd/eddsa-pcd";
import { ListFeedsRequest, PollFeedRequest } from "@pcd/passport-interface";
import { Router } from "express";
import { loadTickets } from "./config";
import { feedHost } from "./feeds";

const routes = Router();

routes.get("/", (req, res) => {
  return res.json({ message: "Hello World" });
});

routes.get("/feeds", async (req, res) => {
  const request = req.body as ListFeedsRequest;

  return res.json(await feedHost.handleListFeedsRequest(request));
});

routes.post("/create-ticket", async (req, res) => {
  const uuid = req.body.uuid;
  if (!uuid) {
    return res.status(400).send("UUID is required");
  }
  // Code to create a ticket for a user goes here
  return res.json({ message: "Ticket created successfully" });
});

routes.post("/feeds", async (req, res) => {
  const request = req.body as PollFeedRequest;

  return res.json(await feedHost.handleFeedRequest(request));
});

routes.get("/feeds/:feedId", async (req, res) => {
  const feedId = req.params.feedId;
  if (feedHost.hasFeedWithId(feedId)) {
    const request = { feedId };
    return res.json(await feedHost.handleListSingleFeedRequest(request));
  } else {
    return res.status(404).send("not found");
  }
});

routes.get("/issue/eddsa-public-key", async (req, res) => {
  return res.json(
    await getEdDSAPublicKey(process.env.SERVER_PRIVATE_KEY as string)
  );
});

routes.get("/ticket/:uuid", async (req, res) => {
  const uuid = req.params.uuid;
  const tickets = await loadTickets();

  for (const ticketArray of Object.values(tickets)) {
    const ticket = ticketArray.find(ticket => ticket.ticketId === uuid);
    if (ticket) {
      return res.json(ticket);
    }
  }

  return res.status(404).send("Ticket not found");
});

export default routes;
