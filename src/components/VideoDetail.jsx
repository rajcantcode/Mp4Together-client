const VideoDetail = ({ videoData, onClick }) => {
  return (
    <div
      className="flex w-full h-[100px] cursor-pointer border-b-2 border-gray-300"
      onClick={onClick}
    >
      <div className="thumbnail min-w-[30%] max-w-[30%] flex items-center">
        <img
          src={videoData.thumbnail}
          alt={videoData.name}
          className="block mx-auto"
        />
      </div>
      <div className="info pl-[10px] flex flex-col justify-center">
        <p
          className="text-sm md:text-lg text-black-500"
          style={{
            maxLines: 2,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {videoData.name.trim()}
        </p>
        <p
          className="text-xs text-gray-400 md:text-base"
          style={{
            maxLines: 1,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 1,
            WebkitBoxOrient: "vertical",
          }}
        >
          {videoData.channel.trim()}
        </p>
      </div>
    </div>
  );
};

export default VideoDetail;
