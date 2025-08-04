const { WebcastPushConnection, TikTokLiveConnection, WebcastEvent } = require('tiktok-live-connector');
const connection = new TikTokLiveConnection('netvietmedia');

connection.connect().then(state => {
    console.info(`Connected to roomId ${state.roomId}`);
}).catch(err => {
    console.error('Failed to connect', err);
});


connection.on('gift', data => {
    console.log('Received gift:', data);
    // console.log(data)
    if (data.repeatEnd === 0) {
        // dùng cho animation
        console.log(`🔄 ${data.user.uniqueId} sent part of ${data.giftDetails.giftName}`);
    }
});
