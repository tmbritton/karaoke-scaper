import axios from "axios";
import { load } from "cheerio";
import { KaraokeSong } from "./types";
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.FK_DB_URL,
  authToken: process.env.FK_DB_TOKEN
});

const args = process.argv.slice(2);
const count = args[0];
const start = args[1] || 0;
const timeStamp = Date.now();
const direction: 'asc' | 'desc' = 'desc';
const url = `https://www.karaokenerds.com/Community/BrowseJson/?length=${count}&start=${start}&order[0][column]=3&order[0][dir]=${direction}&_=${timeStamp}`;

const getKaraokeData = async (): Promise<KaraokeSong[]> => {
  const songData = await axios.get(url).then(({ data }) => {
    const songs = data?.data
    const songList: KaraokeSong[] = []

    const isYoutubeIdInList = (id: string) => songList.findIndex(song => song.youtubeId === id) > -1

    songs.forEach(item => {
      const artist = load(item[1])('a').text();
      const title = load(item[2])('a').text();
      const date = item[3];
      const uploader = load(item[4])('a').text();
      const youtubeLink = item[5].split('|')[0];
      const videoIdMatch = youtubeLink.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^"&?\/\s]{11})/);
      const youtubeId = videoIdMatch ? videoIdMatch[1] : null;
  
      if (youtubeId && artist && title && !isYoutubeIdInList(youtubeId)) {
        songList.push({
          artist,
          title,
          date,
          uploader,
          youtubeId
        })
      }
    });
    return songList;
  });
  return songData;
};

getKaraokeData();

const main = async () => {
  const songList = await getKaraokeData();
  try {
    const result = await client.batch(
      songList.map((song) => {
        return {
          sql: "insert into songs (artist, title, uploader, youtube_id) values (:artist, :title, :uploader, :youtube_id)",
          args: {
            artist: song.artist,
            title: song.title,
            uploader: song.uploader,
            youtube_id: song.youtubeId
          }
        };
      }), "write"
    );
    console.log(result)
  } catch (e) {
      console.error(e);
  }
}

main()

export { getKaraokeData }