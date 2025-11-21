import { DiscordSDK } from "@discord/embedded-app-sdk";
import { io } from "socket.io-client";
import { initGame } from "./game-client.js";
import "./style.css";

// Will eventually store the authenticated user's access_token
let auth;

const discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);

setupDiscordSdk().then((user) => {
  console.log("Discord SDK is authenticated");
  
  // Clean up the loading screen or placeholder
  document.querySelector('#app').style.display = 'none';
  document.getElementById('game-container').style.display = 'block';

  // Connect to Socket.IO
  const socket = io({
    path: '/socket.io', // Ensure this matches the proxy path
  });

  // Start Game
  const username = user?.username || 'Pilot';
  initGame(socket, username);
});

async function setupDiscordSdk() {
  await discordSdk.ready();
  console.log("Discord SDK is ready");

  // Authorize with Discord Client
  const { code } = await discordSdk.commands.authorize({
    client_id: import.meta.env.VITE_DISCORD_CLIENT_ID,
    response_type: "code",
    state: "",
    prompt: "none",
    scope: [
      "identify",
      "guilds",
      "applications.commands"
    ],
  });

  // Retrieve an access_token from your activity's server
  const response = await fetch("/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code,
    }),
  });
  const { access_token } = await response.json();

  // Authenticate with Discord client (using the access_token)
  auth = await discordSdk.commands.authenticate({
    access_token,
  });

  if (auth == null) {
    throw new Error("Authenticate command failed");
  }
  
  return auth.user;
}
