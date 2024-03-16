import lib from '@overextended/ox_lib/client'
import { Point, cache, initLocale, locale, triggerServerCallback } from '@overextended/ox_lib/client'
import * as Cfx from '@nativewrappers/client';
import wx from "../configs/config"

initLocale()

const blips: { [id: string]: any } = {};
let entered = false

function removeAllPlayerBlips() {
    for (const blip in blips) {
        RemoveBlip(blips[blip].blip)
    }
}

async function syncBlips(playersData: {coords: any, id: any, name: any, ped: number}[], zoneCoords: any, zoneRadius: number) {
    for (const player of playersData) {
        if (player.id != GetPlayerServerId(PlayerId())) {
            if (!blips[player.id.toString()]) {
                blips[player.id.toString()] = {coords: player.coords, blipId: 0};
            }

            const [x,y,z] = player.coords
            const pCoords = Cfx.Vector3.fromArray(player.coords)
            const zCoords = Cfx.Vector3.fromArray(zoneCoords)
            const distance = pCoords.distance(zCoords);
            if ((distance) > zoneRadius) {
                removeAllPlayerBlips()
                return
            }
            if (blips[player.id.toString()].coords != player.coords) {
                RemoveBlip(blips[player.id.toString()].blip)
                blips[player.id.toString()].coords = player.coords
                const playerBlip = AddBlipForCoord(x,y,z)
                blips[player.id.toString()].blip = playerBlip
                SetBlipSprite(playerBlip, 480)
                SetBlipScale(playerBlip, 0.8)
                SetBlipColour(playerBlip, 1)
                BeginTextCommandSetBlipName('STRING')
                AddTextComponentSubstringPlayerName(`${locale('otherPlayer')}`)
                EndTextCommandSetBlipName(playerBlip)
            }
        }
    }
} 


for (const zone of wx.redZones) {

    // Blips

    const [x,y,z] = zone.coords
    const blip = AddBlipForCoord(x,y,z)

    SetBlipSprite(blip, 150)
    SetBlipScale(blip, 0.8)
    SetBlipColour(blip, 4)
    SetBlipAsShortRange(blip, true)
    BeginTextCommandSetBlipName('STRING')
    AddTextComponentSubstringPlayerName(wx.blipName)
    EndTextCommandSetBlipName(blip)

    const radius = AddBlipForRadius(x,y,z,zone.radius)
    SetBlipColour(radius, 1)
    SetBlipAlpha(radius, 128)

    // Player Data

    if (wx.playerBlips) {
        async function retrievePlayers() {
            setTimeout(async () => {
                const myCoords = Cfx.Vector3.fromArray(GetEntityCoords(cache.ped,true))
                const zoneCoords = Cfx.Vector3.fromArray(zone.coords)
                const distance = myCoords.distance(zoneCoords);
                if (distance > zone.radius) return
                const response = await triggerServerCallback<{ players: {coords: any, id: any, name: any, ped: number}[] }>('wx_redzone:getPlayers',1);
                if (!response) return;
                for (const player of response.players) {
                    const playerCoords = Cfx.Vector3.fromArray(player.coords)
                    const zoneCoords = Cfx.Vector3.fromArray(zone.coords)
                    const distance = playerCoords.distance(zoneCoords);
                    if (distance < zone.radius) {
                        return syncBlips(response.players, zone.coords, zone.radius);
                    }
                }
            }, 100);
        }
        setInterval(retrievePlayers,500)
    }

    // Points

    const point = new Point({
        coords: zone.coords,
        distance: zone.radius,
    })

    point.onEnter = () => {
        if (!entered) {
            entered = true
            if (wx.notifications) {
                lib.notify({
                    title: "Red Zone",
                    description: locale('entered')
                })
            }
            lib.showTextUI(`${locale('inZone')}`, {
                position: 'top-center',
                icon: 'triangle-exclamation',
                style: {
                  borderRadius: 5,
                  backgroundColor: '#D33F20',
                  color: 'white',
                },
              });
        }
    }
       
    point.onExit = () => {
        if (entered) {
            entered = false
            if (wx.notifications) {
                lib.notify({
                    title: "Red Zone",
                    description: locale('left')
                })
            }
            lib.hideTextUI()

            removeAllPlayerBlips()
        }
    }
}

function isInRedZone() {
    return entered
}

exports(`isInRedZone`, () => isInRedZone);
