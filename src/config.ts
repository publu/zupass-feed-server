import { TicketCategory } from "@pcd/eddsa-ticket-pcd";
import { ethers } from 'ethers';
import 'isomorphic-fetch';

import { v4 as uuidv4 } from 'uuid';
import { z } from "zod";


const TicketSchema = z.object({
  attendeeEmail: z.string(),
  attendeeName: z.string(),
  eventName: z.string(),
  ticketName: z.string(),
  ticketId: z.string().uuid(),
  eventId: z.string().uuid(),
  productId: z.string().uuid(),
  ticketCategory: z.enum(["Devconnect", "ZuConnect", "HackZuzalu", "EthIstanbul", "Linea", "Chiliz Fan", "Mantle", "Scroll"]).transform((str) => {
    if (str === "Devconnect") {
      return TicketCategory.Devconnect;
    } else {
      return TicketCategory.ZuConnect;
    }
  })
});
//  https://api.zupass.org/account/user/4f1f9dd4-b7f9-48e8-ade9-d13da104cf2c?
export type Ticket = z.infer<typeof TicketSchema>;

const TicketFileSchema = z.record(z.array(TicketSchema));

async function queryLineaContract() {
  const provider = new ethers.providers.JsonRpcProvider('https://rpc.linea.build');
  const contractAddress = '0xe47ca047cb7e6a9ade9405ca68077d63424f34ec';
  const contractABI = [{"inputs":[{"internalType":"string","name":"_uuid","type":"string"}],"name":"addUuid","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"getUuids","outputs":[{"internalType":"string[]","name":"","type":"string[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"uuids","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"}]  ; // Replace with the actual ABI
  const contract = new ethers.Contract(contractAddress, contractABI, provider);
  const result = await contract.getUuids(); // Replace with the actual function you want to call
  return result;
}
async function queryChilizContract() {
  const provider = new ethers.providers.JsonRpcProvider('https://rpc.ankr.com/chiliz');
  const contractAddress = '0x56E4ca7f050D9caf72568087B6461405f87a43d8';
  const contractABI = [{"inputs":[{"internalType":"string","name":"_uuid","type":"string"}],"name":"addUuid","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"getUuids","outputs":[{"internalType":"string[]","name":"","type":"string[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"uuids","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"}]; // Replace with the actual ABI
  const contract = new ethers.Contract(contractAddress, contractABI, provider);
  const result = await contract.getUuids(); // Replace with the actual function you want to call
  return result;
}
async function queryChilizTickets(): Promise<Record<string, Ticket[]>> {
  const uuids = await queryChilizContract();
  const tickets = await Promise.all(uuids.map(async (uuid: string) => {
    const ticketData = await queryZupassAPI(uuid);
    if (!ticketData.email) {
      throw new Error(`Missing attendeeEmail for uuid: ${uuid}, ${JSON.stringify(ticketData)}`);
    }
    return TicketSchema.parse(ticketData);
  }));
  return { "ChilizTickets": tickets };
}

const LineaTicketSchema = z.object({
  email: z.string(),
  uuid: z.string().uuid(),
  commitment: z.string(),
  role: z.string(),
  terms_agreed: z.number(),
});

export type LineaTicket = z.infer<typeof LineaTicketSchema>;

const LineaTicketFileSchema = z.record(z.array(LineaTicketSchema));

async function queryZupassAPI(uuid: string) {
  const response = await fetch(`https://api.zupass.org/account/user/${uuid}`);
  const data = await response.json();
  return data;
}

export async function loadLineaTickets(): Promise<Record<string, LineaTicket[]>> {
  const uuids = await queryLineaContract();
  const tickets = await Promise.all(uuids.map(async (uuid: string) => {
    const ticketData = await queryZupassAPI(uuid);
    if (!ticketData.email) {
      throw new Error(`Missing attendeeEmail for uuid: ${uuid}, ${JSON.stringify(ticketData)}`);
    }
    return LineaTicketSchema.parse(ticketData);
  }));
  return { "LineaTickets": tickets };
}

const ChilizTicketSchema = z.object({
  email: z.string(),
  uuid: z.string().uuid(),
  commitment: z.string(),
  role: z.string(),
  terms_agreed: z.number(),
});

export type ChilizTicket = z.infer<typeof ChilizTicketSchema>;

const ChilizTicketFileSchema = z.record(z.array(ChilizTicketSchema));


export async function loadChilizTickets(): Promise<Record<string, ChilizTicket[]>> {
  const uuids = await queryChilizContract();
  const tickets = await Promise.all(uuids.map(async (uuid: string) => {
    const ticketData = await queryZupassAPI(uuid);
    if (!ticketData.email) {
      throw new Error(`Missing attendeeEmail for uuid: ${uuid}, ${JSON.stringify(ticketData)}`);
    }
    return ChilizTicketSchema.parse(ticketData);
  }));
  return { "ChilizTickets": tickets };
}


async function queryScrollContract() {
  const provider = new ethers.providers.JsonRpcProvider('https://rpc.scroll.io');
  const contractAddress = '0xb84Df10966a5D7e1ab46D9276F55d57bD336AFC7';
  const contractABI = [{"inputs":[],"name":"getUuids","outputs":[{"internalType":"string[]","name":"","type":"string[]"}],"stateMutability":"view","type":"function"}]; // Replace with the actual ABI
  const contract = new ethers.Contract(contractAddress, contractABI, provider);
  const result = await contract.getUuids(); // Replace with the actual function you want to call
  return result;
}

const ScrollTicketSchema = z.object({
  email: z.string(),
  uuid: z.string().uuid(),
  commitment: z.string(),
  role: z.string(),
  terms_agreed: z.number(),
});

export type ScrollTicket = z.infer<typeof ScrollTicketSchema>;

const ScrollTicketFileSchema = z.record(z.array(ScrollTicketSchema));

export async function loadScrollTickets(): Promise<Record<string, ScrollTicket[]>> {
  const uuids = await queryScrollContract();
  const tickets = await Promise.all(uuids.map(async (uuid: string) => {
    const ticketData = await queryZupassAPI(uuid);
    if (!ticketData.email) {
      throw new Error(`Missing attendeeEmail for uuid: ${uuid}, ${JSON.stringify(ticketData)}`);
    }
    return ScrollTicketSchema.parse(ticketData);
  }));
  return { "ScrollTickets": tickets };
}


const MantleTicketSchema = z.object({
  email: z.string(),
  uuid: z.string().uuid(),
  commitment: z.string(),
  role: z.string(),
  terms_agreed: z.number(),
});

export type MantleTicket = z.infer<typeof MantleTicketSchema>;

const MantleTicketFileSchema = z.record(z.array(MantleTicketSchema));

async function queryMantleContract() {
  const provider = new ethers.providers.JsonRpcProvider('https://mantle-mainnet.public.blastapi.io');
  const contractAddress = '0xC765D6B7eA9D4b9CcD8cBAdbB0e4726d68e195E4';
  const contractABI = [{"inputs":[{"internalType":"string","name":"_uuid","type":"string"}],"name":"addUuid","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"getUuids","outputs":[{"internalType":"string[]","name":"","type":"string[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"uuids","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"}]; // Replace with the actual ABI
  const contract = new ethers.Contract(contractAddress, contractABI, provider);
  const result = await contract.getUuids(); // Replace with the actual function you want to call
  return result;
}

export async function loadMantleTickets(): Promise<Record<string, MantleTicket[]>> {
  const uuids = await queryMantleContract();
  const tickets = await Promise.all(uuids.map(async (uuid: string) => {
    const ticketData = await queryZupassAPI(uuid);
    if (!ticketData.email) {
      throw new Error(`Missing attendeeEmail for uuid: ${uuid}, ${JSON.stringify(ticketData)}`);
    }
    return MantleTicketSchema.parse(ticketData);
  }));
  return { "MantleTickets": tickets };
}

export async function loadTickets(): Promise<Record<string, Ticket[]>> {
  const lineaTickets = loadLineaTickets();
  const lineaTicketsData = await lineaTickets;
  const lineaTicketsFormatted = lineaTicketsData.LineaTickets.map((ticket: LineaTicket) => {
    return {
      "attendeeEmail": ticket.email,
      "attendeeName": "Linea Builder",
      "eventName": "Linea Buildathon",
      "ticketName": "Linea",
      "ticketId": uuidv4(),
      "eventId": uuidv4(),
      "productId": uuidv4(),
      "ticketCategory": "Linea"
    }
  });
  const chilizTickets = loadChilizTickets();
  const chilizTicketsData = await chilizTickets;
  const chilizTicketsFormatted = chilizTicketsData.ChilizTickets.map((ticket: ChilizTicket) => {
    return {
      "attendeeEmail": ticket.email,
      "attendeeName": "Chiliz Builder",
      "eventName": "Chiliz FanAthon",
      "ticketName": "Chiliz",
      "ticketId": uuidv4(),
      "eventId": uuidv4(),
      "productId": uuidv4(),
      "ticketCategory": "Chiliz Fan"
    }
  });
  const scrollTickets = loadScrollTickets();
  const scrollTicketsData = await scrollTickets;
  const scrollTicketsFormatted = scrollTicketsData.ScrollTickets.map((ticket: ScrollTicket) => {
    return {
      "attendeeEmail": ticket.email,
      "attendeeName": "Scroll Builder",
      "eventName": "Scroll Buildathon",
      "ticketName": "Scroll",
      "ticketId": uuidv4(),
      "eventId": uuidv4(),
      "productId": uuidv4(),
      "ticketCategory": "Scroll"
    }
  });

  const mantleTickets = loadMantleTickets();
  const mantleTicketsData = await mantleTickets;
  const mantleTicketsFormatted = mantleTicketsData.MantleTickets.map((ticket: MantleTicket) => {
    return {
      "attendeeEmail": ticket.email,
      "attendeeName": "Mantle Builder",
      "eventName": "Mantle Buildathon",
      "ticketName": "Mantle",
      "ticketId": uuidv4(),
      "eventId": uuidv4(),
      "productId": uuidv4(),
      "ticketCategory": "Mantle"
    }
  });
  const tickets = TicketFileSchema.parse({
    "Linea": lineaTicketsFormatted,
    "Chiliz": chilizTicketsFormatted,
    "Mantle": mantleTicketsFormatted,
    "Scroll": scrollTicketsFormatted,
    "Zuzalu": [
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
    ],
    "EthIstanbul": [
      {
        "attendeeEmail": "pablo@hashingsystems.com",
        "attendeeName": "Pablo the Penguin",
        "eventName": "Ethereum Istanbul",
        "ticketName": "Hacker",
        "ticketId": "3e8970cf-e4c8-41c1-b9e2-0fb5d197c2ba", 
        "eventId": "f65d8af8-499b-4679-967b-8aa6647b288e",  
        "productId": "a9f5e8a9-5a6e-4419-aa80-5c0f18efb6dd",
        "ticketCategory": "EthIstanbul"
      }
    ]
  });
  console.log("tickets:", tickets)
  return tickets;
}
