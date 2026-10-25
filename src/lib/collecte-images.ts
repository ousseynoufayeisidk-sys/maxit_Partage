import cake from "@/assets/cake.jpg";
import sortie from "@/assets/sortie.jpg";
import facture from "@/assets/collecte-facture.jpg";
import cadeau from "@/assets/collecte-cadeau.jpg";
import evenement from "@/assets/collecte-evenement.jpg";
import ensemble from "@/assets/collecte-ensemble.jpg";
import type { Motif } from "@/lib/collecte";

export const collecteImages: Record<Motif, { src: string; alt: string }> = {
  anniversaire: { src: cake, alt: "Gâteau d’anniversaire" },
  sortie: { src: sortie, alt: "Amis en sortie ensemble" },
  facture: { src: facture, alt: "Facture d’électricité, calculatrice et lampe" },
  cadeau: { src: cadeau, alt: "Un cadeau offert avec affection" },
  evenement: { src: evenement, alt: "Une fête entre proches en plein air" },
  autre: { src: ensemble, alt: "Des mains réunies autour d’un projet commun" },
};