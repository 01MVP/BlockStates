import React, { useState, useEffect } from 'react';

const PingTest = () => {
  const [ping, setPing] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const startTime = Date.now();
      fetch(`${process.env.NEXT_PUBLIC_SERVER_API}/ping`)
        .then(() => {
          const endTime = Date.now();
          setPing(endTime - startTime);
        })
        .catch(() => {
          setPing(null);
        });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-2xl border-2 border-border-main bg-white/90 px-3 py-1 text-xs font-medium text-text-secondary shadow">
      {ping !== null ? `Ping: ${ping}ms` : '网络不可用'}
    </div>
  );
};

export default PingTest;
