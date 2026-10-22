/**
 * Ảnh preview trong khung ngang. Ảnh dọc (screenshot playable) được hiện trọn,
 * đặt trên nền mờ của chính nó thay vì bị cắt mất phần trên/dưới.
 */
export default function Shot({ src, portrait, eager }: { src: string; portrait?: boolean; eager?: boolean }) {
  const loading = eager ? 'eager' : 'lazy';
  if (!portrait) return <img src={src} alt="" loading={loading} className="h-full w-full object-cover" />;
  return (
    <span className="relative block h-full w-full overflow-hidden bg-black">
      <img src={src} alt="" aria-hidden loading={loading} className="absolute inset-0 h-full w-full scale-125 object-cover opacity-50 blur-md" />
      <img src={src} alt="" loading={loading} className="relative h-full w-full object-contain" />
    </span>
  );
}
