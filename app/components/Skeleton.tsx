export default function Skeleton({ loading }: { loading: boolean }) {
  return (
    <>
      <div className="animate-pulse bg-white/10 h-20 rounded-xl" />
      {loading && (
  <div className="grid md:grid-cols-2 gap-4">
    {[...Array(6)].map((_, i) => (
      <div
        key={i}
        className="h-24 bg-gray-800 animate-pulse rounded"
      />
    ))}
  </div>
)}
    </>
  );
}