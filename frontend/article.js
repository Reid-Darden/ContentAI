$(document).ready(async function () {
  // onload
  const urlParams = new URLSearchParams(window.location.search);
  const articleContent = urlParams.get("article");

  let content = localStorage.getItem(articleContent);
  let table = localStorage.getItem("table_" + articleContent);

  let article = await buildArticle(content, table);

  // build the article - call gpt?
  async function buildArticle(content, table) {
    $.ajax({
      url: "/buildarticle",
      method: "POST",
      data: JSON.stringify({
        content: content,
        table: table,
      }),
      contentType: "application/json",
      success: function (response) {
        if (response.success) {
          return response.data;
        }
      },
      error: function () {
        alert("Error creating article.");
      },
    });
  }

  let testHTML = `
  <h2 class="imageCtr">TaylorMade Stealth Fairway Wood</h2>

    <div class="conseg outer s-fit">
  <div class="inner">
    <img alt="" src="">
  </div>
  <div class="inner">
    <div class="innerText">
      <h3>FEATURE CAP BACK™ DESIGN WITH TOE WRAP CONSTRUCTION</h3>
      <p class="fancyLine">The Cap Back™ Design with toe wrap construction is a revolutionary technology that enhances the distance, forgiveness, and feel of the iron. By shifting mass from the extreme high toe of the head to the sole, this advanced engineering feat creates an incredibly low CG. As a result, launching the ball with a hot trajectory throughout the set becomes effortless.</p>
    </div>
  </div>
</div>

<div class="conseg outer s-fit">
  <div class="inner">
    <img alt="" src="">
  </div>
  <div class="inner">
    <div class="innerText">
      <h3>FEATURE FAST FORGIVING FACE</h3>
      <p class="fancyLine">The Fast Forgiving Face features a 450SS face with an intelligently positioned sweet spot. This sweet spot spans the most common impact points, ensuring explosive ball speeds and consistent performance. With this innovative design, golfers can experience maximum distance and forgiveness in all the right places.</p>
    </div>
  </div>
</div>

<div class="conseg outer s-fit">
  <div class="inner">
    <img alt="" src="">
  </div>
  <div class="inner">
    <div class="innerText">
      <h3>FEATURE THRU-SLOT SPEED POCKET</h3>
      <p class="fancyLine">The Thru-Slot Speed Pocket is a patented TaylorMade® technology that maximizes face flexibility for increased ball speed and forgiveness. Specifically engineered to enhance performance on mis-hits low on the face, this feature ensures that golfers achieve optimal distance and forgiveness even on off-center strikes.</p>
    </div>
  </div>
</div>

<div class="conseg outer s-fit">
  <div class="inner">
    <img alt="" src="">
  </div>
  <div class="inner">
    <div class="innerText">
      <h3>FEATURE ECHO DAMPING SYSTEM®</h3>
      <p class="fancyLine">The Echo Damping System® is strategically located behind the face of the iron. By utilizing a soft polymer blend and multiple contact points across the face, this innovative system effectively channels away harsh vibrations. As a result, golfers can enjoy a forged-like feel at impact, enhancing their overall experience with the iron.</p>
    </div>
  </div>
</div>

<div class="conseg outer s-fit">
  <div class="inner">
    <img alt="" src="">
  </div>
  <div class="inner">
    <div class="innerText">
      <h3>FEATURE LAUNCH FLIGHT BIAS</h3>
      <p class="fancyLine">The Launch Flight Bias feature offers golfers different options to suit their playing style and preferences.</p>
    </div>
  </div>
</div>

<div class="conseg outer s-fit">
  <div class="inner">
    <img alt="" src="">
  </div>
  <div class="inner">
    <div class="innerText">
      <h3>FEATURE High-Launch Neutral</h3>
      <p class="fancyLine">The High-Launch Neutral option is designed to provide golfers with a high launch angle, allowing for maximum carry distance and stopping power on the greens.</p>
    </div>
  </div>
</div>

<div class="table-content">
  <table cellpadding="2" cellspacing="0">
    <thead>
      <tr>
        <th colspan="5">
      </th></tr>
      <tr>
        <th>Loft</th>
        <th>Dexterity</th>
        <th>Lie Angle</th>
        <th>Volume</th>
        <th>Length</th>
        <th>Swing Weight</th>
        <th>Launch</th>
        <th>Spin</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>9°</td>
        <td>RH/LH</td>
        <td>56-60°</td>
        <td>460cc</td>
        <td>45.75"</td>
        <td>D4/D5</td>
        <td>Mid-High</td>
        <td>Mid-Low</td>
      </tr>
      <tr>
        <td>10.5°</td>
        <td>RH/LH</td>
        <td>56-60°</td>
        <td>460cc</td>
        <td>45.75"</td>
        <td>D4/D5</td>
        <td>Mid-High</td>
        <td>Mid-Low</td>
      </tr>
      <tr>
        <td>12°</td>
        <td>RH Only</td>
        <td>56-60°</td>
        <td>460cc</td>
        <td>45.75"</td>
        <td>D4/D5</td>
        <td>Mid-High</td>
        <td>Mid-Low</td>
      </tr>
    </tbody>
  </table>
</div>`;
});
