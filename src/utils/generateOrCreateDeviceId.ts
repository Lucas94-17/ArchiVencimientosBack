import * as SecureStore from "expo-secure-store";
import { v4 as uuidv4 } from "uuid";

export async function getOrCreateDeviceId() {
  let deviceId = await SecureStore.getItemAsync("deviceId");

  if (!deviceId) {
    deviceId = uuidv4();
    await SecureStore.setItemAsync("deviceId", deviceId);
  }

  return deviceId;
}
