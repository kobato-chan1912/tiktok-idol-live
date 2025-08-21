import axios from "axios";

async function getAvatarLarger(username) {
  const url = `https://www.tiktok.com/@${username}`;
  const res = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    }
  });

  const html = res.data;
  // Tìm đúng trường avatarLarger
  const match = html.match(/"avatarLarger":"(https:[^"]+)"/);
  if (!match) throw new Error("avatarLarger not found");
  // Decode lại các \u002F thành /
  const avatarUrl = match[1].replace(/\\u002F/g, "/");
  return avatarUrl;
}



// demo
async function main()
{
    let avt = await getAvatarLarger("dungvietmai1912")
    console.log(avt)
}

main()