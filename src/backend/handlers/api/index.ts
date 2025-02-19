import { getSettings } from "../settings";

export async function getNodesInfo() {
    try {
        const settings = await getSettings();
        const response = await fetch(`${settings.nodeProtocol}://${settings.serverIpOrDomain}${settings.serverPort !== "" ? `:${settings.serverPort}` : ""}/v1/operators/info`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching nodes:', error);
        throw error;
    }
}

export async function getPoints(clientId: string) {
    try {        
        const settings = await getSettings();
        const response = await fetch(`${settings.nodeProtocol}://${settings.serverIpOrDomain}${settings.serverPort !== "" ? `:${settings.serverPort}` : ""}/points?clientId=${clientId}`);
        const data = await response.json();

        // if the response is not ok, return -1
        if(response.status !== 200) {
            return {
                points: -1,
            }
        }

        return data;
    } catch (error) {
        return {
            points: -1,
        }
    }
}