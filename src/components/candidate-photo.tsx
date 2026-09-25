export function CandidatePhoto({
  id,
  name,
  hasPhoto,
  photoUrl,
  className = "portrait",
}: {
  id: number;
  name: string;
  hasPhoto: boolean;
  photoUrl?: string | null;
  className?: string;
}) {
  if (photoUrl) return <img className={className} src={photoUrl} alt="" />;
  if (!hasPhoto) return <span className={`${className} empty`} aria-hidden="true" />;
  return <img className={className} src={`/candidats/${id}/photo`} alt="" />;
}
