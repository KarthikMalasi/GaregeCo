const Loading = ({ text = 'Loading...' }) => (
  <div className="loading-box">
    <div className="spinner" />
    <span>{text}</span>
  </div>
);

export default Loading;
