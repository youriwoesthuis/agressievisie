#!/usr/bin/perl
# Genereert een statische pagina per artikel uit data/artikelen.json.
#
# Waarom dit bestaat: artikel.html laadde artikelen via JavaScript op basis
# van ?slug=. Crawlers die geen JavaScript uitvoeren (GPTBot, ClaudeBot,
# PerplexityBot, CCBot) kregen daardoor 18 keer dezelfde lege pagina te zien.
# Dit script bakt de content in kant-en-klare HTML, zodat elk artikel een
# eigen URL heeft met de echte tekst er al in.
#
# Draait automatisch via .github/workflows/build-articles.yml zodra
# data/artikelen.json of data/lexicon.json verandert. Handmatig draaien kan
# ook: `perl build/build-articles.pl` vanuit de repo-root.
use strict;
use warnings;
use utf8;
use JSON::PP;
use File::Basename qw(dirname);
use File::Spec;

binmode(STDOUT, ':encoding(UTF-8)');
binmode(STDERR, ':encoding(UTF-8)');

my $ROOT = File::Spec->rel2abs(File::Spec->catdir(dirname(__FILE__), '..'));

my %MAAND_NL = (
  '01' => 'januari', '02' => 'februari', '03' => 'maart', '04' => 'april',
  '05' => 'mei', '06' => 'juni', '07' => 'juli', '08' => 'augustus',
  '09' => 'september', '10' => 'oktober', '11' => 'november', '12' => 'december',
);

my %BADGE_CLASS = (
  'Onderzoek' => 'badge--onderzoek',
  'Trends'    => 'badge--trends',
  'Praktijk'  => 'badge--praktijk',
);

sub lees_bestand {
  my ($pad) = @_;
  open(my $fh, '<:encoding(UTF-8)', $pad) or die "Kan $pad niet lezen: $!\n";
  local $/;
  my $inhoud = <$fh>;
  close $fh;
  return $inhoud;
}

sub schrijf_bestand {
  my ($pad, $inhoud) = @_;
  open(my $fh, '>:encoding(UTF-8)', $pad) or die "Kan $pad niet schrijven: $!\n";
  print $fh $inhoud;
  close $fh;
}

sub esc_html {
  my ($s) = @_;
  return '' unless defined $s;
  $s =~ s/&/&amp;/g;
  $s =~ s/</&lt;/g;
  $s =~ s/>/&gt;/g;
  return $s;
}

sub esc_attr {
  my ($s) = @_;
  $s = esc_html($s);
  $s =~ s/"/&quot;/g;
  return $s;
}

# Komt overeen met JavaScript's encodeURIComponent(): alles behalve
# A-Za-z0-9 en -_.~ wordt percent-encoded, op basis van de UTF-8-bytes. Nodig
# omdat toekomstige artikeltitels leestekens of accenten kunnen bevatten die
# nu toevallig niet in de bestaande 18 titels voorkomen.
sub url_encode {
  my ($s) = @_;
  my $bytes = $s;
  utf8::encode($bytes);
  $bytes =~ s/([^A-Za-z0-9\-_.~])/sprintf('%%%02X', ord($1))/ge;
  return $bytes;
}

# Knipt een omschrijving netjes af op maximaal 155 tekens (de praktische
# grens voor een meta-omschrijving), bij voorkeur op een zinsgrens. Vindt de
# tekst geen goede zinsgrens, dan valt hij terug op een woordgrens plus "…".
# Bestaat de tekst al uit 155 tekens of minder, dan verandert er niets.
sub korte_omschrijving {
  my ($tekst, $max) = @_;
  $max //= 155;
  return $tekst if length($tekst) <= $max;
  my $stuk = substr($tekst, 0, $max);
  if ($stuk =~ /^(.{40,}?[.!?])\s/s) {
    return $1;
  }
  $stuk =~ s/\s+\S*$//;
  return "$stuk…";
}

sub formatteer_datum_nl {
  my ($iso) = @_;
  my ($jaar, $maand, $dag) = $iso =~ /^(\d{4})-(\d{2})-(\d{2})$/;
  return $iso unless $jaar;
  $dag =~ s/^0//;
  return "$dag $MAAND_NL{$maand} $jaar";
}

my $json = JSON::PP->new->utf8(0);

my $artikelen = $json->decode(lees_bestand(File::Spec->catfile($ROOT, 'data', 'artikelen.json')));
my $lexicon    = $json->decode(lees_bestand(File::Spec->catfile($ROOT, 'data', 'lexicon.json')));
my %lexicon_bij_slug = map { $_->{slug} => $_ } @$lexicon;

# Zelfde sortering als js/articles.js: nieuwste eerst.
my @gesorteerd = sort { $b->{datum} cmp $a->{datum} } @$artikelen;

my $template = lees_bestand(File::Spec->catfile($ROOT, 'build', 'article.template.html'));

sub artikel_kaart_html {
  my ($a) = @_;
  my $badge = $BADGE_CLASS{ $a->{categorie} } || '';
  return sprintf(
    qq{\n    <a class="card article-card" href="artikel-%s.html">\n      <span class="badge %s">%s</span>\n      <h3>%s</h3>\n      <p>%s</p>\n      <div class="article-meta">\n        <span>%s</span>\n      </div>\n    </a>},
    $a->{slug}, $badge, esc_html($a->{categorie}), esc_html($a->{titel}),
    esc_html($a->{excerpt}), formatteer_datum_nl($a->{datum}),
  );
}

my $aantal_geschreven = 0;

for my $a (@gesorteerd) {
  my $slug = $a->{slug};
  die "Artikel zonder slug gevonden, kan geen bestand schrijven\n" unless $slug;

  my $canonical = "https://agressievisie.nl/artikel-$slug.html";
  # Geen " | AgressieVisie"-achtervoegsel: elders op de site laten pagina's
  # met een al lange, zelfstandige titel dat achtervoegsel ook weg (zie
  # artikelen.html, doxing.html). Artikeltitels zijn per definitie lang
  # genoeg om zonder te kunnen; met achtervoegsel kwamen alle 18 boven de
  # aanbevolen SERP-lengte uit, gemeten met Screaming Frog op 17-08-2026.
  my $titel_pagina = $a->{titel};
  my $meta_omschrijving = korte_omschrijving($a->{excerpt});
  my $badge = $BADGE_CLASS{ $a->{categorie} } || '';

  # ── Schema: Article + BreadcrumbList, zelfde vorm als de oude injectArticleSchema() ──
  my $citation = $a->{bron_url}
    ? { '@type' => 'CreativeWork', name => $a->{bron_naam}, url => $a->{bron_url} }
    : undef;
  my @schema = (
    {
      '@context' => 'https://schema.org', '@type' => 'Article',
      headline => $a->{titel}, description => $a->{excerpt},
      datePublished => $a->{datum}, dateModified => $a->{datum},
      articleSection => $a->{categorie}, inLanguage => 'nl-NL',
      isAccessibleForFree => JSON::PP::true,
      mainEntityOfPage => { '@type' => 'WebPage', '@id' => $canonical },
      image => 'https://agressievisie.nl/img/og-image.jpg',
      author => { '@type' => 'Organization', name => 'Redactie AgressieVisie', url => 'https://agressievisie.nl/over.html' },
      publisher => {
        '@type' => 'Organization', name => 'AgressieVisie', url => 'https://agressievisie.nl/',
        logo => { '@type' => 'ImageObject', url => 'https://agressievisie.nl/img/og-image.jpg' },
      },
      ($citation ? (citation => $citation) : ()),
    },
    {
      '@context' => 'https://schema.org', '@type' => 'BreadcrumbList',
      itemListElement => [
        { '@type' => 'ListItem', position => 1, name => 'Home', item => 'https://agressievisie.nl/' },
        { '@type' => 'ListItem', position => 2, name => 'Artikelen', item => 'https://agressievisie.nl/artikelen.html' },
        { '@type' => 'ListItem', position => 3, name => $a->{titel}, item => $canonical },
      ],
    },
  );
  my $schema_json = $json->canonical(1)->encode(\@schema);

  # ── Breadcrumbs (zichtbaar) ──
  my $breadcrumbs = sprintf(
    '<a href="index.html">Home</a><span class="sep">/</span><a href="artikelen.html">Artikelen</a><span class="sep">/</span><span class="current">%s</span>',
    esc_html($a->{titel}),
  );

  # ── Termchips ──
  my $term_chips_html = '';
  if ($a->{begrippen} && @{ $a->{begrippen} }) {
    my @termen = grep { defined } map { $lexicon_bij_slug{$_} } @{ $a->{begrippen} };
    if (@termen) {
      $term_chips_html = '<div class="term-chips"><span class="term-chips-label">Begrippen:</span>'
        . join('', map { sprintf('<a class="term-chip" href="lexicon.html#%s">%s</a>', $_->{slug}, esc_html($_->{term})) } @termen)
        . '</div>';
    }
  }

  # ── Deelknoppen: URL's liggen op build-tijd al vast, geen JS nodig behalve de kopieerknop ──
  my $share_text = url_encode($a->{titel});
  my $encoded_url = url_encode($canonical);
  my $share_row = <<"SHARE";
<div class="share-row">
      <span class="share-label">Delen:</span>
      <a class="share-btn" href="https://www.linkedin.com/sharing/share-offsite/?url=$encoded_url" target="_blank" rel="noopener" aria-label="Delen op LinkedIn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.4 20.4h-3.5v-5.5c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9v5.6H9.5V9h3.4v1.6h.1c.5-.9 1.6-1.8 3.4-1.8 3.6 0 4.3 2.4 4.3 5.5v6.1ZM5.7 7.4a2 2 0 1 1 0-4 2 2 0 0 1 0 4ZM7.5 20.4h-3.6V9h3.6v11.4Z"/></svg>
      </a>
      <a class="share-btn" href="https://twitter.com/intent/tweet?text=$share_text&url=$encoded_url" target="_blank" rel="noopener" aria-label="Delen op X">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.3 2H21l-6.6 7.5L22.2 22h-6.9l-5.4-6.7L3.7 22H1l7.1-8.1L1 2h7l4.9 6.1L18.3 2Zm-1.2 18h1.9L7 3.9H5l12.1 16.1Z"/></svg>
      </a>
      <a class="share-btn" href="mailto:?subject=$share_text&body=$encoded_url" aria-label="Delen via e-mail">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/></svg>
      </a>
      <button class="share-btn" id="share-copy" aria-label="Kopieer link" type="button">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      </button>
    </div>
SHARE

  # ── Artikelbody ──
  my $paragrafen = join("\n      ", map { "<p>" . esc_html($_) . "</p>" } @{ $a->{inhoud} });
  my $article_body = sprintf(
    qq{    <span class="badge %s">%s</span>\n    <h1>%s</h1>\n    <div class="article-meta"><span>%s</span></div>\n    <div class="article-body">\n      %s\n    </div>\n    <div class="source-note">Bron: <a href="%s" target="_blank" rel="noopener" style="text-decoration:underline; color:inherit;">%s</a></div>\n    %s\n    %s\n    <div class="editorial-box">\n      <div class="editorial-avatar"></div>\n      <div>\n        <b>Redactie AgressieVisie</b>\n        <span>Kennisplatform over agressie, onderdeel van Act in Move Training &amp; Coaching</span>\n      </div>\n    </div>},
    $badge, esc_html($a->{categorie}), esc_html($a->{titel}), formatteer_datum_nl($a->{datum}),
    $paragrafen, esc_attr($a->{bron_url}), esc_html($a->{bron_naam}),
    $term_chips_html, $share_row,
  );

  # ── Gerelateerde artikelen: zelfde categorie, jongste eerst, max 3 ──
  my @related = grep { $_->{slug} ne $slug && $_->{categorie} eq $a->{categorie} } @gesorteerd;
  @related = @related[0 .. (@related > 3 ? 2 : $#related)] if @related;
  my $related_section = '';
  if (@related) {
    my $kaarten = join('', map { artikel_kaart_html($_) } @related);
    $related_section = qq{<section class="section section--soft">\n  <div class="wrap">\n    <h2 class="center">Gerelateerde artikelen</h2>\n    <div class="grid grid-3" style="margin-top:32px;">$kaarten\n    </div>\n  </div>\n</section>};
  }

  # ── Sjabloon invullen ──
  my $pagina = $template;
  my %vervang = (
    '{{TITLE}}'          => esc_html($titel_pagina),
    '{{DESCRIPTION}}'    => esc_attr($meta_omschrijving),
    '{{CANONICAL}}'      => esc_attr($canonical),
    '{{OG_TITLE}}'       => esc_attr($titel_pagina),
    '{{SCHEMA_JSON}}'    => $schema_json,
    '{{BREADCRUMBS}}'    => $breadcrumbs,
    '{{ARTICLE_BODY}}'   => $article_body,
    '{{RELATED_SECTION}}'=> $related_section,
  );
  # Let op: bewust GEEN /e of /ee hier. De vervangtekst komt uit artikeldata
  # en mag nooit als Perl-code worden uitgevoerd. \Q...\E maakt de zoeksleutel
  # veilig, en $waarde als gewone scalar in de vervanging wordt letterlijk
  # ingevoegd zonder herparsing.
  for my $sleutel (keys %vervang) {
    my $waarde = $vervang{$sleutel};
    $pagina =~ s/\Q$sleutel\E/$waarde/g;
  }

  my $doel = File::Spec->catfile($ROOT, "artikel-$slug.html");
  schrijf_bestand($doel, $pagina);
  $aantal_geschreven++;
  print "geschreven: artikel-$slug.html\n";
}

print "\nKlaar: $aantal_geschreven van " . scalar(@gesorteerd) . " artikelen geschreven.\n";
