import axios from "axios";
import { load } from "cheerio";
import { KaraokeSong } from "./types";

const count = 10;
const timeStamp = Date.now();
const direction: 'asc' | 'desc' = 'desc';
const url = `https://www.karaokenerds.com/Community/BrowseJson/?length=${count}&order[0][column]=3&order[0][dir]=${direction}&_=${timeStamp}`;

const getKaraokeData = async (): Promise<KaraokeSong[]> => {
  const songData = await axios.get(url).then(({ data }) => {
    const songs = data?.data
    const songList: KaraokeSong[] = []
    console.log(`${data?.data?.length} songs in raw data`)

    songs.forEach(item => {
      const artist = load(item[1])('a').text();
      const title = load(item[2])('a').text();
      const date = item[3];
      const uploader = load(item[4])('a').text();
      const youtubeLink = item[5].split('|')[0];
      const videoIdMatch = youtubeLink.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^"&?\/\s]{11})/);
      const youtubeId = videoIdMatch ? videoIdMatch[1] : null;
  
      if (youtubeId && artist && title) {
        songList.push({
          artist,
          title,
          date,
          uploader,
          youtubeId
        })
      }
    });
    console.log(`${songList.length} songs after parsing`)
    console.log(songList)
    return songList;
  });
  return songData;
};

getKaraokeData();

export default getKaraokeData;
