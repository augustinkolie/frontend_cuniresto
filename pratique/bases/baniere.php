
<!-- BANNIERE -->
<div class="banniere">
      <div class="opacite">
        <div class="description">
            <h2 id="apparition">Bienvenue <span> <?= $_SESSION["user"]["prenom"] ?></span> au Restaurant 3.0</h2>   
            <p id="para-anime">Lorem ipsum dolor sit amet consectetur adipisicing elit. Impedit eum sunt, nesciunt saepe alias magni eaque dicta illo, quo at id libero atque laboriosam repellat nihil doloremque quisquam earum. Provident nostrum eligendi, nulla nesciunt, veniam blanditiis aliquid ut praesentium ipsam voluptatum enim voluptatibus minus nemo? Tenetur fugiat adipisci similique deserunt.</p>
          </div>
          <?php if(!isset($_SESSION["user"])):?>
          <div class="effets" style="display: none;">
            <div class="cercle"></div>
            <div class="cercle"></div>
            <div class="cercle"></div>
            <div class="cercle"></div>
          </div>
          <?php else: ?>
            <div class="effets">
            <div class="cercle"></div>
            <div class="cercle"></div>
            <div class="cercle"></div>
            <div class="cercle"></div>
          </div>
          <?php endif;?>
        <a href="reservation.php" id="btn-cmd">Commandez &#8594</a>
      </div>
    </div>