import {
  type ErrorResponse,
  type SessionInitResponse,
} from "../types/game-types";
import { v4 as uuidv4 } from "uuid";

export async function initializeSessionAPI(): Promise<SessionInitResponse> {
  // 1. Megpróbáljuk lekérni a meglévő azonosítót (ha van)
  const clientUuid = localStorage.getItem("cid") || undefined;

  try {
    // 2. Meghívjuk a végpontot.
    // Mivel a callApiEndpoint-ben ott a credentials: "include",
    // a szerver automatikusan megkapja/beállítja a sütiket.
    const data = await callApiEndpoint<SessionInitResponse>(
      "/api/initialize_session",
      "POST",
      { client_id: clientUuid }, // Elküldjük, de a szerver dönt, hogy elfogadja-e
    );

    // 3. Ha a szerver új/másik ID-t adott vissza, elmentjük emlékeztetőnek
    if (data?.client_id) {
      localStorage.setItem("cid", data.client_id);
    }

    return data;
  } catch (error) {
    console.error("Hiba az inicializálás során:", error);
    throw error;
  }
}

export async function setAuth(
  email: string,
  password: string,
  isLogIn: boolean,
) {
  return await callApiEndpoint("/api/handle_auth", "POST", {
    username: email,
    password: password,
    is_login: isLogIn,
  });
}

export async function setForgotPasswordSubmit(token: string, password: string) {
  return await callApiEndpoint(`/api/reset_password/${token}`, "POST", {
    password: password,
  });
}

export async function setBet(betAmount: number, selectedBetType: number) {
  return await callApiEndpoint("/api/bet", "POST", {
    bet: betAmount,
    type: selectedBetType,
  });
}

export async function retakeBet(selectedBetType: number) {
  return await callApiEndpoint("/api/retake_bet", "POST", {
    type: selectedBetType,
  });
}

export async function getShuffling() {
  return await callApiEndpoint("/api/create_deck", "POST");
}

export async function setShoeCut(amount: number) {
  return await callApiEndpoint("/api/shoe_cut", "POST", { cut: amount });
}

export async function startGame() {
  return await callApiEndpoint("/api/start_game", "POST");
}

export async function setRestart() {
  return await callApiEndpoint("/api/set_restart", "POST");
}

export async function forceRestart() {
  // Már nem kell a localStorage-ból semmi,
  // mert a callApiEndpoint elküldi a sütit!
  return await callApiEndpoint("/api/force_restart", "POST");
}

export interface HttpError extends Error {
  response?: {
    // A response property most opcionális
    status: number;
    statusText: string;
    error?: string;
    data?: ErrorResponse; // A szerver válasza (pl. { error: 'No more split hands.' })
  };
}

type ApiRequestBody = Record<string, unknown> | null | undefined;

export async function callApiEndpoint<T>(
  endpoint: string,
  method: string = "GET",
  body: ApiRequestBody = null,
  isRetry: boolean = false,
): Promise<T> {
  try {
    const options: RequestInit = {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Sütik küldése a sessionhöz
    };

    if (method === "POST") {
      const effectiveBody = (body ?? {}) as { idempotency_key?: string };
      if (!effectiveBody.idempotency_key) {
        effectiveBody.idempotency_key = uuidv4();
      }
      options.body = JSON.stringify(effectiveBody);
    }

    const response = await fetch(endpoint, options);

    if (!response.ok) {
      const status = response.status;
      let errorData: ErrorResponse = {};

      try {
        errorData = await response.json();
      } catch {
        errorData = { message: "Ismeretlen hiba történt a szerveren." };
      }

      // --- 401 RETRY LOGIKA ---
      if (status === 401 && !isRetry) {
        console.warn("Session lejárt, próbálkozás megújítással...");
        try {
          await initializeSessionAPI();

          return await callApiEndpoint<T>(endpoint, method, body, true);
        } catch (retryError) {
          console.error("Az automata újra-inicializálás sikertelen.");
          throw retryError;
        }
      }

      // Hiba objektum összeállítása
      const errorToThrow = new Error(
        errorData.message || `HTTP hiba: ${status}`,
      ) as HttpError;
      errorToThrow.response = {
        status: status,
        statusText: response.statusText,
        data: errorData,
      };
      throw errorToThrow;
    }

    if (response.status === 204) return {} as T;
    return (await response.json()) as T;
  } catch (error: unknown) {
    // Típusbiztos hibakezelés a catch ágban
    const httpError = error as HttpError;
    const isAuthError = httpError.response?.status === 401;
    const isSplitError =
      httpError.response?.status === 400 &&
      httpError.response?.data?.error === "No more split hands.";

    if (!isAuthError && !isSplitError) {
      console.error("Váratlan hiba:", error);
    }
    throw error;
  }
}
