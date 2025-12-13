const RatingStars = ({ rating = 0 }) => (
  <div className="flex items-center gap-1">
    {Array.from({ length: 5 }).map((_, index) => {
      const level = rating - index
      const filled = level >= 1
      const faded = level > 0 && level < 1
      return (
        <span
          key={index}
          className={filled ? 'text-amber-500' : faded ? 'text-amber-300' : 'text-slate-300'}
        >
          ƒ~.
        </span>
      )
    })}
  </div>
)

export default RatingStars
