# Project media

Use this folder for project-specific images and videos.

Recommended structure:

```text
imagesProjects/
  lumina-studio/
    cover.jpg
    detail-01.jpg
    process-video.mp4
  marea-identity/
    cover.jpg
    mockup-01.jpg
```

Then reference files from `data/projects-data.js` like this:

```js
media: {
    carousel: [
        {
            type: "image",
            src: "imagesProjects/lumina-studio/cover.jpg",
            alt: "Lumina Studio packaging mockup"
        },
        {
            type: "video",
            src: "imagesProjects/lumina-studio/process-video.mp4",
            poster: "imagesProjects/lumina-studio/video-poster.jpg",
            caption: "Motion study for the launch"
        }
    ],
    gallery: [
        {
            type: "image",
            src: "imagesProjects/lumina-studio/detail-01.jpg",
            alt: "Close view of the Lumina Studio visual system"
        }
    ]
}
```
