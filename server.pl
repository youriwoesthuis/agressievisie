#!/usr/bin/perl
use strict;
use warnings;
use IO::Socket::INET;
use FindBin qw($RealBin);

chdir($RealBin) or die "Cannot chdir to $RealBin: $!\n";

my $port = 3001;
my %mime = (
    html => 'text/html; charset=utf-8',
    css  => 'text/css; charset=utf-8',
    js   => 'application/javascript; charset=utf-8',
    json => 'application/json; charset=utf-8',
    xml  => 'application/xml; charset=utf-8',
    png  => 'image/png',
    jpg  => 'image/jpeg',
    svg  => 'image/svg+xml; charset=utf-8',
    ico  => 'image/x-icon',
    woff2 => 'font/woff2',
);

my $subscribers_file = 'data/abonnees.json';
my $contact_file = 'data/contactberichten.json';
my $aanvulling_file = 'data/aanvullingen.json';
my $email_re = qr/^[^\s@]+\@[^\s@]+\.[^\s@]+$/;

sub json_extract {
    my ($body, $key) = @_;
    my ($val) = $body =~ /"\Q$key\E"\s*:\s*"((?:[^"\\]|\\.)*)"/s;
    return undef unless defined $val;
    $val =~ s/\\n/\n/g;
    $val =~ s/\\r//g;
    $val =~ s/\\t/\t/g;
    $val =~ s/\\"/"/g;
    $val =~ s/\\\\/\\/g;
    return $val;
}

sub json_escape {
    my ($s) = @_;
    $s =~ s/\\/\\\\/g;
    $s =~ s/"/\\"/g;
    $s =~ s/\r?\n/\\n/g;
    $s =~ s/\t/\\t/g;
    return $s;
}

my $server = IO::Socket::INET->new(
    LocalPort => $port,
    Type      => SOCK_STREAM,
    Reuse     => 1,
    Listen    => 32,
) or die "Cannot bind port $port: $!\n";

$SIG{PIPE} = 'IGNORE';
$SIG{CHLD} = 'IGNORE';
print "AgressieVisie draait op http://localhost:$port\n";
$| = 1;

while (my $client = $server->accept()) {
    my $pid = fork();
    if (!defined $pid) {
        close $client;
        next;
    }
    if ($pid == 0) {
        handle_request($client);
        close $client;
        exit(0);
    }
    close $client;
}

sub handle_request {
    my ($client) = @_;
    my ($method, $path, %headers);

    eval {
        local $SIG{ALRM} = sub { die "timeout\n" };
        alarm(3);

        my $request_line = <$client>;
        alarm(0);
        die "empty\n" if !defined $request_line;
        ($method, $path) = $request_line =~ /^(\w+)\s+(\S+)/;
        die "malformed\n" if !$method;

        alarm(3);
        while (my $line = <$client>) {
            last if $line eq "\r\n" || $line eq "\n";
            if ($line =~ /^([\w-]+):\s*(.*?)\r?\n$/) {
                $headers{lc($1)} = $2;
            }
        }
        alarm(0);
    };
    if ($@) {
        alarm(0);
        return;
    }

    if ($method eq 'POST' && $path eq '/api/nieuwsbrief') {
        my $len = $headers{'content-length'} || 0;
        my $body = '';
        if ($len > 0) {
            eval {
                local $SIG{ALRM} = sub { die "timeout\n" };
                alarm(3);
                read($client, $body, $len);
                alarm(0);
            };
            alarm(0);
        }

        my ($email) = $body =~ /"email"\s*:\s*"([^"]*)"/;

        if (!$email || $email !~ $email_re) {
            my $resp = '{"error":"Vul een geldig e-mailadres in."}';
            print $client "HTTP/1.1 400 Bad Request\r\nContent-Type: application/json\r\nContent-Length: " . length($resp) . "\r\nConnection: close\r\n\r\n$resp";
            return;
        }

        my @subscribers;
        if (open my $fh, '<:raw', $subscribers_file) {
            local $/;
            my $raw = <$fh>;
            close $fh;
            while ($raw =~ /"email"\s*:\s*"([^"]*)"/g) {
                push @subscribers, $1;
            }
        }

        my $already = grep { lc($_) eq lc($email) } @subscribers;
        if (!$already) {
            open my $fh, '<:raw', $subscribers_file;
            local $/;
            my $raw = $fh ? <$fh> : '[]';
            close $fh if $fh;
            $raw =~ s/\s+$//;
            my $entry = "{\"email\":\"$email\",\"aangemeld_op\":\"" . iso_now() . "\"}";
            if ($raw =~ /^\[\]$/) {
                $raw = "[\n  $entry\n]";
            } else {
                $raw =~ s/\]$/,\n  $entry\n]/;
            }
            open my $out, '>:raw', $subscribers_file or die $!;
            print $out $raw;
            close $out;
        }

        my $resp = '{"ok":true}';
        print $client "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: " . length($resp) . "\r\nConnection: close\r\n\r\n$resp";
        return;
    }

    if ($method eq 'POST' && $path eq '/api/contact') {
        my $len = $headers{'content-length'} || 0;
        my $body = '';
        if ($len > 0) {
            eval {
                local $SIG{ALRM} = sub { die "timeout\n" };
                alarm(3);
                read($client, $body, $len);
                alarm(0);
            };
            alarm(0);
        }

        my $naam = json_extract($body, 'naam') || '';
        my $email = json_extract($body, 'email') || '';
        my $bericht = json_extract($body, 'bericht') || '';

        if (!$naam || !$email || $email !~ $email_re || !$bericht) {
            my $resp = '{"error":"Vul alle velden in met een geldig e-mailadres."}';
            print $client "HTTP/1.1 400 Bad Request\r\nContent-Type: application/json\r\nContent-Length: " . length($resp) . "\r\nConnection: close\r\n\r\n$resp";
            return;
        }

        my $raw = '[]';
        if (open my $fh, '<:raw', $contact_file) {
            local $/;
            $raw = <$fh>;
            close $fh;
        }
        $raw =~ s/\s+$//;
        my $entry = "{\"naam\":\"" . json_escape($naam) . "\",\"email\":\"" . json_escape($email) . "\",\"bericht\":\"" . json_escape($bericht) . "\",\"verzonden_op\":\"" . iso_now() . "\"}";
        if ($raw =~ /^\[\]$/) {
            $raw = "[\n  $entry\n]";
        } else {
            $raw =~ s/\]$/,\n  $entry\n]/;
        }
        open my $out, '>:raw', $contact_file or die $!;
        print $out $raw;
        close $out;

        my $resp = '{"ok":true}';
        print $client "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: " . length($resp) . "\r\nConnection: close\r\n\r\n$resp";
        return;
    }

    if ($method eq 'POST' && $path eq '/api/aanvulling') {
        my $len = $headers{'content-length'} || 0;
        my $body = '';
        if ($len > 0) {
            eval {
                local $SIG{ALRM} = sub { die "timeout\n" };
                alarm(3);
                read($client, $body, $len);
                alarm(0);
            };
            alarm(0);
        }

        my $type = json_extract($body, 'type') || '';
        my $beschrijving = json_extract($body, 'beschrijving') || '';
        my $link = json_extract($body, 'link') || '';
        my $naam = json_extract($body, 'naam') || '';
        my $email = json_extract($body, 'email') || '';

        if (!$type || !$beschrijving || ($email && $email !~ $email_re)) {
            my $resp = '{"error":"Kies een type en vul een beschrijving in. E-mailadres moet geldig zijn als je het invult."}';
            print $client "HTTP/1.1 400 Bad Request\r\nContent-Type: application/json\r\nContent-Length: " . length($resp) . "\r\nConnection: close\r\n\r\n$resp";
            return;
        }

        my $raw = '[]';
        if (open my $fh, '<:raw', $aanvulling_file) {
            local $/;
            $raw = <$fh>;
            close $fh;
        }
        $raw =~ s/\s+$//;
        my $entry = "{\"type\":\"" . json_escape($type) . "\",\"beschrijving\":\"" . json_escape($beschrijving) . "\",\"link\":\"" . json_escape($link) . "\",\"naam\":\"" . json_escape($naam) . "\",\"email\":\"" . json_escape($email) . "\",\"status\":\"nieuw\",\"ingediend_op\":\"" . iso_now() . "\"}";
        if ($raw =~ /^\[\]$/) {
            $raw = "[\n  $entry\n]";
        } else {
            $raw =~ s/\]$/,\n  $entry\n]/;
        }
        open my $out, '>:raw', $aanvulling_file or die $!;
        print $out $raw;
        close $out;

        my $resp = '{"ok":true}';
        print $client "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: " . length($resp) . "\r\nConnection: close\r\n\r\n$resp";
        return;
    }

    $path = '/index.html' if !$path || $path eq '/';
    $path =~ s/\?.*//;
    $path =~ s|^/||;

    my $file = $path || 'index.html';
    my ($ext) = $file =~ /\.(\w+)$/;
    my $ct = $mime{lc($ext || '')} || 'text/plain';

    if (-f $file) {
        open my $fh, '<:raw', $file or do {
            print $client "HTTP/1.1 500 Error\r\nContent-Length: 5\r\n\r\nError";
            return;
        };
        local $/;
        my $body = <$fh>;
        close $fh;
        my $len  = length($body);
        print $client "HTTP/1.1 200 OK\r\nContent-Type: $ct\r\nContent-Length: $len\r\nConnection: close\r\n\r\n$body";
    } elsif (-f '404.html') {
        open my $fh, '<:raw', '404.html';
        local $/;
        my $body = <$fh>;
        close $fh;
        my $len = length($body);
        print $client "HTTP/1.1 404 Not Found\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: $len\r\nConnection: close\r\n\r\n$body";
    } else {
        my $body = "404 Not Found: $file";
        my $len  = length($body);
        print $client "HTTP/1.1 404 Not Found\r\nContent-Type: text/plain\r\nContent-Length: $len\r\nConnection: close\r\n\r\n$body";
    }
}

sub iso_now {
    my @t = gmtime(time);
    return sprintf("%04d-%02d-%02dT%02d:%02d:%02dZ", $t[5]+1900, $t[4]+1, $t[3], $t[2], $t[1], $t[0]);
}
