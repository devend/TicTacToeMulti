using System;
using System.Collections.Generic;
using System.Web;
using System.Web.Script.Serialization;
using System.Text;
using System.Data;
using MySql.Data.MySqlClient;

// Return a game to show. It can be a new game or an ongoing game.
public partial class tictactoe_getgame : System.Web.UI.Page
{
    private int mPlayerId;
    private int mGameId;
    private int mQueueId;
    private string mError = "";
    private string mConString;

    protected void Page_Load(object sender, EventArgs e)
    {
        mConString = (string)Application["conTicTacToe"];
        GameState state = null;
        ParseRequest();

        if (mGameId < 1)
        {
            // The player has no valid game id - start a new game.
            state = StartNewGame();
        }
        else
        {
            // The player has a valid game id - get the current state.
            state = GetGameState();
        }

        SendResponse(state);
    }

    private void ParseRequest()
    {
        mPlayerId = Convert.ToInt32(Request.Form.Get("playerId"));
        mGameId = Convert.ToInt32(Request.Form.Get("gameId"));
    }

    private GameState StartNewGame() 
    {
        GameState state = new GameState();

        MySqlConnection con = new MySqlConnection(mConString);
        MySqlCommand cmd = new MySqlCommand();
        cmd.Connection = con;

        MySqlDataReader reader = null;
        try
        {
            con.Open();

            cmd.CommandText = "LOCK TABLES queue WRITE, game WRITE";
            cmd.ExecuteNonQuery();
            
            // Use FIFO queue type
            cmd.CommandText = "SELECT id, playerid, gameid FROM queue LIMIT 1";
            reader = cmd.ExecuteReader();

            if(reader.Read()) {
                int queueId = reader.GetInt32(0);
                int playerId = reader.GetInt32(1);
                mGameId = reader.GetInt32(2);

                // Remove the reader before proceeding to be able to reuse MySqlCommand.
                if (reader != null)
                    reader.Close();

                if (playerId == mPlayerId)
                {
                    // The player had already placed a game request in table queue.
                    // Delete the game request from table queue.
                    DeleteFromQueue(queueId, cmd);

                    // Create a new game
                    mGameId = CreateGame(cmd);

                    // Add the game to the queue
                    Enqueue(cmd);
                }
                else
                {
                    // There is a waiting game for this player. Update table game set player2 to mPlayerId
                    AddSecondPlayer(cmd, playerId);

                    // Delete from queue
                    DeleteFromQueue(queueId, cmd);
                }
            }
            else
            {
                // Nothing in the queue. Make sure there are no reader before proceeding.
                if (reader != null)
                    reader.Close();

                // Create a new game
                mGameId = CreateGame(cmd);

                // Add the game to the queue
                Enqueue(cmd);
            }

            if (reader != null)
                reader.Close();

            cmd.CommandText = "UNLOCK TABLES";
            cmd.ExecuteNonQuery();
        }
        catch (MySqlException e)
        {
            mError = e.Message;
        }
        finally
        {
            if (reader != null)
                reader.Close();
            con.Close();
        }

        return GetGameState();
    }

    private int CreateGame(MySqlCommand cmd)
    {
        int id = 0;

        StringBuilder commandText = new StringBuilder();
        commandText.Append("INSERT INTO game (id, player1, player2, currentplayer, b0, b1, b2, b3, b4, b5, b6, b7, b8, status, winner, created) VALUES (0, ");
        commandText.Append(mPlayerId);      // player1
        commandText.Append(", 0, ");        // player2
        commandText.Append(mPlayerId);      // currentplayer
        commandText.Append(", 0, ");        // b0
        commandText.Append("0, ");          // b1
        commandText.Append("0, ");          // b2
        commandText.Append("0, ");          // b3
        commandText.Append("0, ");          // b4
        commandText.Append("0, ");          // b5
        commandText.Append("0, ");          // b6
        commandText.Append("0, ");          // b7
        commandText.Append("0, ");          // b8
        commandText.Append("0, ");          // status
        commandText.Append("0, ");          // winner
        commandText.Append("NOW() )");      // created

        try
        {
            cmd.CommandText = commandText.ToString();
            cmd.ExecuteNonQuery();

            cmd.CommandText = "SELECT LAST_INSERT_ID()";
            id = Convert.ToInt32(cmd.ExecuteScalar());
        }
        catch (MySqlException e)
        {
            mError = e.Message;
            id = -2;
        }
        catch (Exception e)
        {
            mError = e.Message;
            id = -3;
        }

        return id;
    }

    private void Enqueue(MySqlCommand cmd)
    {
        // Insert a new waiting game in table queue
        StringBuilder commandText = new StringBuilder();
        commandText.Append("INSERT INTO queue (id, playerid, gameid) VALUES (0, ");
        commandText.Append(mPlayerId);  // playerid
        commandText.Append(", ");
        commandText.Append(mGameId);     // gameid
        commandText.Append(")");

        try
        {
            cmd.CommandText = commandText.ToString();
            cmd.ExecuteNonQuery();
        }
        catch (MySqlException e)
        {
            mError = e.Message;
        }
        catch (Exception e)
        {
            mError = e.Message;
        }
    }

    private void AddSecondPlayer(MySqlCommand cmd, int player1)
    {
        int boardSum = GetBoardSum(cmd);

        // Update table game set player2 to mPlayerId
        StringBuilder commandText = new StringBuilder();
        commandText.Append("UPDATE game SET player2=");
        commandText.Append(mPlayerId);

        // Set currentplayer to mPlayerId if player1 has already set a move. If player1 not yet has set a move
        // don't update currentplayer since it's still player1's turn. A boardSum > 0 means player2's turn.
        if (boardSum > 0)
        {
            // Set currentplayer = player2
            commandText.Append(", currentplayer=");
            commandText.Append(mPlayerId);  // mPlayerId = second player
        }
        else
        {
            // Set currentplayer = player1
            commandText.Append(", currentplayer=");
            commandText.Append(player1);
        }

        commandText.Append(" WHERE id=");
        commandText.Append(mGameId);

        try
        {
            cmd.CommandText = commandText.ToString();
            cmd.ExecuteNonQuery();
        }
        catch (MySqlException e)
        {
            mError = e.Message;
        }
        catch (Exception e)
        {
            mError = e.Message;
        }
    }

    private int GetBoardSum(MySqlCommand cmd)
    {
        int sum = 0;

        try
        {
            cmd.CommandText = string.Concat("SELECT SUM(b0 + b1 + b2 + b3 + b4 + b5 + b6 + b7 + b8) FROM game WHERE id=", mGameId);
            sum = Convert.ToInt32(cmd.ExecuteScalar());
            mError = "sum = " + sum;
        }
        catch (MySqlException e)
        {
            mError = e.Message;
        }

        return sum;
    }

    private void DeleteFromQueue(int queueId, MySqlCommand cmd)
    {
        // Delete from table queue where queue.id = parameter queueId
        StringBuilder commandText = new StringBuilder();
        commandText.Append("DELETE FROM queue WHERE id=");
        commandText.Append(queueId);         

        try
        {
            cmd.CommandText = commandText.ToString();
            cmd.ExecuteNonQuery();
        }
        catch (MySqlException e)
        {
            mError = e.Message;
        }
        catch (Exception e)
        {
            mError = e.Message;
        }
    }

    private GameState GetGameState()
    {
        // Fill a state object with data from table game where game.id = mGameId
        GameState state = new GameState();

        MySqlConnection con = new MySqlConnection(mConString);
        MySqlCommand cmd = new MySqlCommand();
        cmd.Connection = con;

        MySqlDataReader reader = null;
        try
        {
            con.Open();
            cmd.CommandText = string.Concat("SELECT * FROM game WHERE id=", mGameId);
            reader = cmd.ExecuteReader();

            if (reader.Read())
            {
                state.gameId = reader.GetInt32(0);
                state.player1 = reader.GetInt32(1);
                state.player2 = reader.GetInt32(2);
                state.currentPlayer = reader.GetInt32(3);
                state.b0 = reader.GetInt32(4);
                state.b1 = reader.GetInt32(5);
                state.b2 = reader.GetInt32(6);
                state.b3 = reader.GetInt32(7);
                state.b4 = reader.GetInt32(8);
                state.b5 = reader.GetInt32(9);
                state.b6 = reader.GetInt32(10);
                state.b7 = reader.GetInt32(11);
                state.b8 = reader.GetInt32(12);
                state.status = reader.GetInt32(13);
                state.winner = reader.GetInt32(14);
                state.error = mError;
            }
        }
        catch (MySqlException e)
        {
            mError = e.Message;
        }
        finally
        {
            if (reader != null)
                reader.Close();
            con.Close();
        }

        return state;
    }
   
    private void SendResponse(GameState state)
    {
        JavaScriptSerializer js = new JavaScriptSerializer();
        Response.Write(js.Serialize(state));
    }

    private class GameState
    {
        public int gameId { get; set; }
        public int player1 { get; set; }
        public int player2 { get; set; }
        public int currentPlayer { get; set; }
        public int b0 { get; set; }
        public int b1 { get; set; }
        public int b2 { get; set; }
        public int b3 { get; set; }
        public int b4 { get; set; }
        public int b5 { get; set; }
        public int b6 { get; set; }
        public int b7 { get; set; }
        public int b8 { get; set; }
        public int status { get; set; }
        public int winner { get; set; }
        public string error { get; set; }
    }
}