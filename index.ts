import axios from "axios";
import { load } from "cheerio";
import { KaraokeSong } from "./types";

const url = "https://www.karaokenerds.com/GlobalKaraokeCommunity/Browse";

enum DataMap {
  "artist" = 0,
  "title" = 1,
  "date" = 2,
  "uploader" = 3,
  "youtubeId" = 4,
}

const scrapeKaraokeData = (): Promise<KaraokeSong[]> => {
  return axios.get(url).then(({ data }) => {
    const $ = load(data);
    const rows = $(".table tr");
    const songList: KaraokeSong[] = [];
    rows.map((_, row) => {
      const tableCells = $(row).find("td");
      const song = {
        artist: $(tableCells[DataMap["artist"]])?.text()?.trim(),
        title: $(tableCells[DataMap["title"]])?.text()?.trim(),
        date: $(tableCells[DataMap["date"]])?.text()?.trim(),
        uploader: $(tableCells[DataMap["uploader"]])?.text()?.trim(),
        youtubeId: $(tableCells[DataMap["youtubeId"]])
          ?.find("a")
          ?.attr("href")
          ?.split("=")[1]
          ?.trim(),
      };
      if (song.artist && song.title && song.youtubeId) {
        songList.push(song);
      }
    });
    return songList;
  });
};

export default scrapeKaraokeData;
