import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";


const WEATHER_API_BASE = process.env.WEATHER_API_BASE;
const USER_AGENT = "weather-app/1.0";
interface IpWhoIsResponse {
  "About Us": string;
  ip: string;
  success: boolean;
  type: "IPv4" | "IPv6";
  continent: string;
  continent_code: string;
  country: string;
  country_code: string;
  region: string;
  region_code: string;
  city: string;
  latitude: number;
  longitude: number;
  is_eu: boolean;
  postal: string;
  calling_code: string;
  capital: string;
  borders: string;
  flag: Flag;
  connection: Connection;
  timezone: Timezone;
}

interface Flag {
  img: string;
  emoji: string;
  emoji_unicode: string;
}

interface Connection {
  asn: number;
  org: string;
  isp: string;
  domain: string;
}

interface Timezone {
  id: string;
  abbr: string;
  is_dst: boolean;
  offset: number;
  utc: string;
  current_time: string;
}

// 最终导出主接口
export interface GeoLocationData extends IpWhoIsResponse {}

// Helper function for making NWS API requests


async function makeNWSRequest<T>(url: string): Promise<T | null> {
  const headers = {
    "User-Agent": USER_AGENT,
    Accept: "application/json",
    'X-QW-Api-Key': process.env.WEATHER_API_KEY || '',
  };

  try {
    const response = await fetch(url, { headers });
    // if (!response.ok) {
    //   throw new Error(`HTTP error! status: ${response.status}: ${response.statusText} ${response.body}`);
    // }
    return (await response.json()) as T;
  } catch (error) {
    console.error("Error making NWS request:", error);
    return null;
  }
}

async function getLocation(): Promise<GeoLocationData | null> {
  try {
    const location = await fetch("https://ipwho.is/");

    const data = await location.json();
    return data as GeoLocationData;
  } catch (error) {
    console.error("Error getting location:", error);
    return null;
  }
}
interface AlertFeature {
  properties: {
    event?: string;
    areaDesc?: string;
    severity?: string;
    status?: string;
    headline?: string;
  };
}
interface ForecastPeriod {
  name?: string;
  temperature?: number;
  temperatureUnit?: string;
  windSpeed?: string;
  windDirection?: string;
  shortForecast?: string;
}
interface AlertsResponse {
  features: AlertFeature[];
}
interface NowWeather {
  obsTime: string;
  temp: string;
  feelsLike: string;
  icon: string;
  text: string;
  wind360: string; //风向360角度
  windDir: string; //风向
  windScale: string; //风力等级
  humidity: string; // 相对湿度
  precip: string; //降水量
  pressure: string; //大气压强
  vis: string; //能见度
  cloud: string; //云量
  dew: string; //露点温度
}
interface PointsResponse {
  code: string;
  now: NowWeather;
}
interface ForecastResponse {
  properties: {
    periods: ForecastPeriod[];
  };
}
// Create server instance
export const server = new McpServer({
  name: "weather",
  version: "1.0.0",
  capabilities: {
    tools: {},
  },
});
server.tool(
  "get-forecast",
  "Get current time weather forecast for a given location",
  {
    latitude: z.number().min(-90).max(90).describe("Latitude of the location"),
    longitude: z.number().min(-180).max(180).describe("Longitude of the location"),
  },
  async ({ latitude, longitude }) => {
    // Get grid point data
    const pointsUrl = `${WEATHER_API_BASE}/v7/weather/now?location=${longitude.toFixed(4)},${latitude.toFixed(4)}`;
    const pointsData = await makeNWSRequest<PointsResponse>(pointsUrl);

    if (!pointsData) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to rget forecast data for coordinates: ${latitude}, ${longitude}.`,
          },
        ],
      };
    }

    const now = pointsData.now;
    if (!now) {
      return {
        content: [
          {
            type: "text",
            text: "forecast data invalid:" + JSON.stringify(pointsData) + ' ' + pointsUrl,
          },
        ],
      };
    }


    // Format forecast periods
    const nowWeather = [
      `Current Time: ${now.obsTime}`,
      `Temperature: ${now.temp || "Unknown"}°`,
      `Wind: ${now.windScale || "Unknown"} ${now.windDir || ""}`,
      `${now.text || "No forecast available"}`,
      // "---",
    ].join("\n");


    const forecastText = `Forecast for ${latitude}, ${longitude}:\n\n${nowWeather}`;

    return {
      content: [
        {
          type: "text",
          text: forecastText,
        },
      ],
    };
  }
);
server.tool(
  'get-location',
  'Get latitude and longitude from current location',
  {},
  async () => {
    const result = await getLocation();
    return {
      content: [
        {
          type: "text",
          text: `Current Latitude: ${result?.latitude}, Longitude: ${result?.longitude}`,
        },
      ],
    };
  }
);
