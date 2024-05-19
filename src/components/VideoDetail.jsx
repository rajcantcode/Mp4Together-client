const VideoDetail = ({ videoData, onClick }) => {
  return (
    <div
      className="flex w-full h-[100px] cursor-pointer border-b-2 border-gray-300"
      onClick={onClick}
    >
      <div className="thumbnail min-w-[20%] flex items-center">
        <img
          src={videoData.thumbnail}
          alt={videoData.name}
          className="block mx-auto"
        />
      </div>
      <div className="info">
        <p className="text-xl text-black-500">{videoData.name.trim()}</p>
        <p className="text-base text-gray-400">{videoData.channel.trim()}</p>
      </div>
    </div>
  );
};

export default VideoDetail;
