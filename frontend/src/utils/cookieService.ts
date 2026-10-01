import Cookies from "js-cookie";

const ACCESS_TOKEN_COOKIE = "accessToken";
const REFRESH_TOKEN_COOKIE = "refreshToken";

function authCookieOptions() {
	return {
		path: "/",
		sameSite: "lax" as const,
		secure: window.location.protocol === "https:",
	};
}

export function getCookie(name: string): string | undefined {
	return Cookies.get(name);
}

export function getAccessToken(): string | undefined {
	return getCookie(ACCESS_TOKEN_COOKIE);
}

export function getRefreshToken(): string | undefined {
	return getCookie(REFRESH_TOKEN_COOKIE);
}

export function setAuthTokens(accessToken: string, refreshToken: string): void {
	const options = authCookieOptions();
	Cookies.set(ACCESS_TOKEN_COOKIE, accessToken, options);
	Cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, options);
}

export function clearAuthTokens(): void {
	const options = authCookieOptions();
	Cookies.remove(ACCESS_TOKEN_COOKIE, options);
	Cookies.remove(REFRESH_TOKEN_COOKIE, options);
}


