export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 rounded-full border-2 border-white/10 border-t-[#22c55e] animate-spin" />
    </div>
  );
}
