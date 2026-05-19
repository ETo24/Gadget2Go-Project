import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, BadgeCheck, Sparkles, Star, MapPin, Store, User as UserIcon, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { CONDITION_GRADES } from '../lib/mockData';

function trustColor(score) {
  if (score >= 85) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 65) return 'text-teal-600 dark:text-teal-400';
  if (score >= 40) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
}

export default function ProductCard({ product, view = 'grid' }) {
  const { isLiked, toggleLike, user } = useApp();
  const liked = isLiked(product.id);
  const canLike = user?.role !== 'admin';
  const cond = CONDITION_GRADES.find(c => c.id === product.condition);
  const aiDelta = (product.aiFair || product.price) - product.price;
  const goodDeal = aiDelta >= 0;
  const seller = product.seller || {};
  const isDealer = seller.role === 'dealer';
  const dist = product.distanceKm;

  if (view === 'list') {
    return (
      <Link to={`/buy/${product.id}`} className="block" data-testid={`product-card-${product.id}`}>
        <motion.div whileHover={{ y: -2 }} className="bento-card flex gap-4 p-4">
          <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-2xl bg-muted">
            <img src={product.images?.[0]} alt={product.title} className="h-full w-full object-cover" />
            <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-navy backdrop-blur">{cond?.label}</span>
          </div>
          <div className="flex flex-1 flex-col">
            <div className="flex items-start justify-between gap-2">
              <p className="line-clamp-2 font-heading font-semibold">{product.title}</p>
              {canLike && (
                <button onClick={(e) => { e.preventDefault(); toggleLike(product.id); }} aria-label="Like" data-testid={`save-${product.id}`}>
                  <Heart className={`h-5 w-5 ${liked ? 'fill-rose-500 text-rose-500' : 'text-muted-foreground'}`} />
                </button>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" /> {product.location}
              {dist !== undefined && <span>· {dist} km</span>}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {isDealer && <span className="inline-flex items-center gap-1 rounded-full bg-navy px-2 py-0.5 text-[10px] font-semibold text-white"><Store className="h-3 w-3" />Dealer</span>}
              {seller.verified && <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700 dark:bg-teal-500/10 dark:text-teal-400"><BadgeCheck className="h-3 w-3" />Verified</span>}
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${trustColor(seller.trustScore)}`}><ShieldCheck className="h-3 w-3" />Trust {seller.trustScore}</span>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{seller.rating}</span>
            </div>
            <div className="mt-auto flex items-end justify-between">
              <div>
                <p className="font-heading text-xl font-bold text-foreground">${Number(product.price).toLocaleString()}</p>
                <p className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-700 dark:text-teal-400"><Sparkles className="h-3 w-3" />AI fair ${product.aiFair}</p>
              </div>
              {goodDeal && <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">Good Deal</span>}
            </div>
          </div>
        </motion.div>
      </Link>
    );
  }

  return (
    <Link to={`/buy/${product.id}`} className="block" data-testid={`product-card-${product.id}`}>
      <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 220, damping: 20 }} className="bento-card overflow-hidden">
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img src={product.images?.[0]} alt={product.title} className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-navy backdrop-blur">{cond?.label}</span>
          <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
            {isDealer && <span className="inline-flex items-center gap-1 rounded-full bg-navy px-2 py-1 text-[10px] font-bold text-white shadow-lg"><Store className="h-3 w-3" />Dealer</span>}
            {seller.verified && <span className="inline-flex items-center gap-1 rounded-full bg-teal-500 px-2 py-1 text-[10px] font-bold text-white shadow-lg"><BadgeCheck className="h-3 w-3" />Verified</span>}
          </div>
          {dist !== undefined && (
            <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold text-navy backdrop-blur"><MapPin className="h-3 w-3" />{dist} km</span>
          )}
          <button
            onClick={(e) => { e.preventDefault(); toggleLike(product.id); }}
            aria-label="Like"
            data-testid={`save-${product.id}`}
            className={`absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 backdrop-blur shadow-md transition-transform hover:scale-105 ${canLike ? '' : 'hidden'}`}
          >
            <Heart className={`h-4 w-4 ${liked ? 'fill-rose-500 text-rose-500' : 'text-navy'}`} />
          </button>
        </div>
        <div className="p-4">
          <p className="line-clamp-1 font-heading text-sm font-semibold">{product.title}</p>
          <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{product.location}</span>
            <span className={`inline-flex items-center gap-1 ${trustColor(seller.trustScore)}`}><ShieldCheck className="h-3 w-3" />{seller.trustScore}</span>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="font-heading text-lg font-bold">${Number(product.price).toLocaleString()}</p>
              <p className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-700 dark:text-teal-400"><Sparkles className="h-3 w-3" />Fair ${product.aiFair}</p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{seller.rating}</span>
          </div>
          {product.matchScore !== undefined && (
            <div className="mt-3 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-gradient-to-r from-teal-400 to-teal-600" style={{ width: `${product.matchScore}%` }} />
              </div>
              <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400">{product.matchScore}%</span>
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  );
}
