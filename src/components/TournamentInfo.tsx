"use client";

import { motion } from "framer-motion";

type InfoItem = {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
};

const infoItems: InfoItem[] = [
  {
    icon: "fi-rr-calendar",
    label: "Tanggal",
    value: "Minggu, 9 Agustus 2026",
  },
  {
    icon: "fi-rr-clock",
    label: "Jam",
    value: "17:00 WIB",
  },
  {
    icon: "fi-rr-marker",
    label: "Lokasi",
    value: "Warkop Sippo Wiyung",
  },
  {
    icon: "fi-rr-trophy",
    label: "Prize Pool",
    value: "±Rp 1.500.000",
    highlight: true,
  },
  {
    icon: "fi-rr-ticket",
    label: "Entry Fee",
    value: "Rp 50.000 / Slot",
    sub: "Maksimal 2 Slot per Tim",
  },
  {
    icon: "fi-rr-phone-call",
    label: "Kontak",
    value: "0895364711840",
    sub: "Alief (WhatsApp)",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function TournamentInfo() {
  return (
    <section className="w-full py-6 px-4">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
        }}
        className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {infoItems.map((item, i) => (
          <motion.div
            key={i}
            variants={cardVariants}
            className={`card-hover group relative rounded-2xl p-5 flex items-center gap-4 overflow-hidden min-h-[104px]
              ${item.highlight
                ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-200"
                : "bg-white border border-gray-100 shadow-sm hover:border-amber-200"
              }`}
          >
            {item.highlight && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full" />
                <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-white/10 rounded-full" />
              </div>
            )}
            <div
              className={`relative z-10 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105
                ${item.highlight ? "bg-white/20" : "bg-gradient-to-br from-amber-50 to-orange-50"}`}
            >
              <i
                className={`fi ${item.icon} text-xl ${item.highlight ? "text-white" : "text-orange-500"}`}
              />
            </div>
            <div className="relative z-10 min-w-0">
              <p
                className={`text-[11px] font-semibold uppercase tracking-wider mb-0.5
                  ${item.highlight ? "text-white/80" : "text-gray-400"}`}
              >
                {item.label}
              </p>
              <p
                className={`font-bold leading-tight truncate
                  ${item.highlight ? "text-white text-lg" : "text-gray-800 text-[15px]"}`}
              >
                {item.value}
              </p>
              {item.sub && (
                <p
                  className={`text-xs mt-0.5 font-medium
                    ${item.highlight ? "text-white/80" : "text-orange-500"}`}
                >
                  {item.sub}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
