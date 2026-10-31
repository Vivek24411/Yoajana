export default function Loading() {
  return (
    <div className="flex flex-col gap-4 pt-10" aria-busy="true">
      <div className="skeleton size-[4.5rem] rounded-full" />
      <div className="skeleton h-7 w-60" />
      <div className="skeleton h-4 w-72" />
    </div>
  );
}
