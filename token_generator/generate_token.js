import { AccessToken } from 'livekit-server-sdk';


const LIVEKIT_API_KEY = '';
const LIVEKIT_API_SECRET = '';
const LIVEKIT_URL = '';// provide your credentials 

const ROOM_NAME = '';

if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL || !ROOM_NAME) {
  throw new Error("Missing one or more LiveKit credentials");
}


(async () => {
  const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: 'ai-agent',
    name: 'Salon AI Agent',
  });

  token.addGrant({
    roomJoin: true,
    room: ROOM_NAME,
  });

  const jwt = await token.toJwt(); 

  console.log('\n✅ Paste the following into agent/.env:\n');
  console.log(`LIVEKIT_URL=${LIVEKIT_URL}`);
  console.log(`ACCESS_TOKEN=${jwt}\n`);
})();
