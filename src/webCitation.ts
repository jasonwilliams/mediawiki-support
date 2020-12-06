import fetch from "node-fetch";
import * as cheerio from "cheerio";
import { DateTime } from "luxon";

export const fetchWebContent = async (url: string): Promise<string> => {
  let result = new WebResult(url);
  return result.fetch();
};

interface IArchiveResponse {
  archived_snapshots: {
    closest?: {
      available: boolean;
      url: string;
      timestamp: string;
      status: string;
    };
  };
  url: string;
}
class WebResult {
  title: string | null = null;
  siteName: string | null = null;
  accessDate = DateTime.local().toISODate();
  publishedDate: string | null = null;
  url: string;
  archiveApiUrl: string;
  archivedUrl: string | null;
  archivedDate: string | null;
  $!: any;

  constructor(url: string, archive: boolean = false) {
    this.url = url;
    this.archiveApiUrl = `https://archive.org/wayback/available?url=${this.url}`;
    this.title = null;
    this.siteName = null;
    this.archivedUrl = null;
    this.archivedDate = null;
  }

  async fetch(): Promise<string> {
    const fetchContent = fetch(this.url);
    const fetchArchivedContent = fetch(this.archiveApiUrl);
    // Fetch content and archive in parallel
    const results = await Promise.all([fetchContent, fetchArchivedContent]);

    const text = await results[0].text();
    const archiveResponse: IArchiveResponse = await results[1].json();

    // Check archive and get the closest
    if (archiveResponse?.archived_snapshots?.closest) {
      this.archivedUrl = archiveResponse.archived_snapshots.closest.url;
      this.archivedDate = DateTime.fromFormat(
        archiveResponse.archived_snapshots.closest.timestamp,
        "yyyyMMddhhmmss"
      ).toISODate();
    }

    this.$ = cheerio.load(text);
    this.setTitle();
    this.setSiteName();
    this.setPublishedDate();
    return this.toString();
  }

  private setTitle() {
    // Prefer og:title
    if (this.$("meta[property='og:og:title']").length) {
      this.title =
        this.$("meta[property='og:og:title']").attr("content") || null;
      return;
    }

    // Try twitter:title
    if (this.$("meta[property='twitter:title']").length) {
      this.title =
        this.$("meta[property='twitter:title']").attr("content") || null;
      return;
    }

    // Try the <h1>
    if (this.$("h1").length) {
      this.title = this.$("h1").text();
      return;
    }

    // fallback to <title>
    if (this.$("title").length) {
      this.title = this.$("title").text();
      return;
    }
  }

  private setPublishedDate() {
    // published date can be tricky, some news sites use article:published_time

    // Prefer article:published_time
    // https://ogp.me/
    if (this.$("meta[property='article:published_time']").length) {
      let date = this.$("meta[property='article:published_time']").attr(
        "content"
      );
      if (date) {
        this.publishedDate = DateTime.fromISO(date).toISODate();
      }
    }

    // Try <time> element
    if (this.$("time").length) {
      let date = this.$("time").attr("datetime");
      if (date) {
        this.publishedDate = DateTime.fromISO(date).toISODate();
      }
    }
  }

  private setSiteName() {
    // Prefer og:site_name
    if (this.$("meta[property='og:site_name']").length) {
      this.siteName =
        this.$("meta[property='og:site_name']").attr("content") || null;
      return;
    }

    // try twitter:site
    if (this.$("meta[property='twitter:site']").length) {
      this.siteName =
        this.$("meta[property='twitter:site']").attr("content") || null;
      return;
    }
  }

  toString() {
    let result = `{{cite web |url=${this.url} |access-date=${this.accessDate}`;
    if (this.siteName) {
      result = `${result} |website=${this.siteName}`;
    }

    if (this.title) {
      result = `${result} |title=${this.title.trim()}`;
    }

    if (this.publishedDate) {
      result = `${result} |publication-date=${this.publishedDate}`;
    }

    if (this.archivedUrl) {
      result = `${result} |archive-url=${this.archivedUrl} |archive-date=${this.archivedDate} |url-status=live`;
    }

    result = `${result}}}`;

    return result;
  }
}
