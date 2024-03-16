import { onClientCallback } from '@overextended/ox_lib/server';
onClientCallback('wx_redzone:getPlayers', (playerId) => {
    let players: { ped: number; coords: any, name: string, id: any }[] = [];

    for (const player of getPlayers()) {
        const ped = GetPlayerPed(player)
        const [x,y,z] = GetEntityCoords(ped)
        const name = GetPlayerName(player)
        players.push({ ped: ped, coords: [x,y,z], name: name, id: player });
    }

    return {
      players: players,
    };
  });