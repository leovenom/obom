type DecorVariant = 'hero' | 'auth';

interface DecorShapesProps {
  variant?: DecorVariant;
}

export default function DecorShapes({ variant = 'hero' }: DecorShapesProps) {
  return (
    <div className={`decor-shapes decor-shapes--${variant}`} aria-hidden="true">
      <div className="decor-blob decor-blob--coral" />
      <div className="decor-blob decor-blob--blue" />
      <div className="decor-blob decor-blob--cream" />
    </div>
  );
}
