import { TicketCategory } from "@pcd/eddsa-ticket-pcd";
import { z } from "zod";

const TicketSchema = z.object({
  attendeeEmail: z.string(),
  attendeeName: z.string(),
  eventName: z.string(),
  ticketName: z.string(),
  ticketId: z.string().uuid(),
  eventId: z.string().uuid(),
  productId: z.string().uuid(),
  ticketCategory: z.enum(["Devconnect", "ZuConnect", "HackZuzalu"]).transform((str) => {
    if (str === "Devconnect") {
      return TicketCategory.Devconnect;
    } else {
      return TicketCategory.ZuConnect;
    }
  })
});

export type Ticket = z.infer<typeof TicketSchema>;

const TicketFileSchema = z.record(z.array(TicketSchema));

export async function loadTickets(): Promise<Record<string, Ticket[]>> {
  const tickets = TicketFileSchema.parse({
    "HackZuzalu": [
      {
        "attendeeEmail": "pablo@hashingsystems.com",
        "attendeeName": "Pablo the Penguin",
        "eventName": "HackZuzalu Istanbul",
        "ticketName": "Hacker",
        "ticketId": "f65d8af8-e4c8-41c1-b9e2-0fb5d197c2ba", 
        "eventId": "3e8970cf-499b-4679-967b-8aa6647b288e",  
        "productId": "a9f5e8a9-5a6e-4419-aa80-5c0f18efb6dd",
        "ticketCategory": "HackZuzalu"
      }
    ]
  });
  return tickets;
}
