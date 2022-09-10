let options = {
  token: '',
  appId: '',
  channel: 'test',
};

const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

let localTracks = [];
let remoteUsers = {};

let joinAndDisplayLocalStream = async () => {
  client.on('user-published', handleUserJoined);
  client.on('user-left', handleUserLeft);

  let UID = await client.join(
    options.appId,
    options.channel,
    options.token,
    null
  );

  localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();

  let player = `<div class="px-1 py-1 col col-lg-4 col-md-6 col-sm-12 " id="user-container-${UID}">
                  <div class="col-item item-user" id="user-${UID}"></div>
                </div>`;

  document.getElementById('streams').insertAdjacentHTML('beforeend', player);

  localTracks[1].play(`user-${UID}`);

  await client.publish([localTracks[0], localTracks[1]]);
};

let joinStream = async () => {
  await joinAndDisplayLocalStream();

  document.getElementById('join').style.display = 'none';
  document.getElementById('controls').style.display = 'flex';
};

let handleUserJoined = async (user, mediaType) => {
  remoteUsers[user.uid] = user;
  await client.subscribe(user, mediaType);

  if (mediaType === 'video') {
    let player = `<div class="px-1 py-1 col col-lg-4 col-md-6 col-sm-12" id="user-container-${user.uid}">
                    <div class="col-item" id="user-${user.uid}"></div>
                  </div>`;

    document.getElementById('streams').insertAdjacentHTML('beforeend', player);

    user.videoTrack.play(`user-${user.uid}`);
  }

  if (mediaType === 'audio') {
    user.audioTrack.play();
  }
};

let handleUserLeft = async user => {
  delete remoteUsers[user.uid];
  document.getElementById(`user-container-${user.uid}`).remove();
};

let leaveAndRemoveLocalStream = async () => {
  for (trackName in localTracks) {
    let track = localTracks[trackName];
    track.stop();
    track.close();
  }

  await client.leave();

  document.getElementById('join').style.display = 'block';
  document.getElementById('controls').style.display = 'none';
  document.getElementById('streams').innerHTML = '';
};

let toggleMicrophone = async e => {
  if (localTracks[0].muted) {
    await localTracks[0].setMuted(false);
    e.target.innerText = 'Mic On';
    e.target.classList.add('btn-info');
    e.target.classList.remove('btn-secondary');
  } else {
    await localTracks[0].setMuted(true);
    e.target.innerText = 'Mic Off';
    e.target.classList.add('btn-secondary');
    e.target.classList.remove('btn-info');
  }
};

let toggleCamera = async e => {
  if (localTracks[1].muted) {
    await localTracks[1].setMuted(false);
    e.target.innerText = 'Camera On';
    e.target.classList.add('btn-info');
    e.target.classList.remove('btn-secondary');
  } else {
    await localTracks[1].setMuted(true);
    e.target.innerText = 'Camera Off';
    e.target.classList.add('btn-secondary');
    e.target.classList.remove('btn-info');
  }
};

document.getElementById('join').addEventListener('click', joinStream);
document
  .getElementById('leave')
  .addEventListener('click', leaveAndRemoveLocalStream);
document.getElementById('mic').addEventListener('click', toggleMicrophone);
document.getElementById('camera').addEventListener('click', toggleCamera);
