using System;
using System.Collections.Generic;
using System.Web;
using System.Web.Script.Serialization;
using System.Text;
using System.Data;
using MySql.Data.MySqlClient;

public partial class tictactoe_updategame : System.Web.UI.Page
{
    string mConString;

    protected void Page_Load(object sender, EventArgs e)
    {
        mConString = (string)Application["conTicTacToe"];
        GameState state = ParseRequest();

        // Make sure the database are synced related to this request. If state.player2 == 0 it is necessary to check so another player hasn't already grabbed 
        // this game from the queue. This may happen for example because of network problems or if player1 got a phone call before the first move.
        if (state.player2 == 0)
        {
            // Check for a second player. If found - set state.player2 and state.currentplayer to that player.
            int player2 = GetSecondPlayer(state.gameId);
            if (player2 > 0)
            {
                state.player2 = player2;
                state.currentPlayer = player2;
            }
        }

        ClientMessage msg = UpdateGame(state);

        // Send a status report to the client
        msg.status = msg.error.Equals("") ? "OK" : "FAIL";
        SendResponse(msg);
    }

    private GameState ParseRequest()
    {
        GameState state = new GameState();
        state.gameId = Convert.ToInt32(Request.Form.Get("gameId"));
        state.player1 = Convert.ToInt32(Request.Form.Get("player1"));
        state.player2 = Convert.ToInt32(Request.Form.Get("player2"));
        state.currentPlayer = Convert.ToInt32(Request.Form.Get("currentPlayer"));
        state.b0 = Convert.ToInt32(Request.Form.Get("b0"));
        state.b1 = Convert.ToInt32(Request.Form.Get("b1"));
        state.b2 = Convert.ToInt32(Request.Form.Get("b2"));
        state.b3 = Convert.ToInt32(Request.Form.Get("b3"));
        state.b4 = Convert.ToInt32(Request.Form.Get("b4"));
        state.b5 = Convert.ToInt32(Request.Form.Get("b5"));
        state.b6 = Convert.ToInt32(Request.Form.Get("b6"));
        state.b7 = Convert.ToInt32(Request.Form.Get("b7"));
        state.b8 = Convert.ToInt32(Request.Form.Get("b8"));
        state.status = Convert.ToInt32(Request.Form.Get("status"));
        state.winner = Convert.ToInt32(Request.Form.Get("winner"));

        return state;
    }

    private int GetSecondPlayer(int id)
    {
        int player2 = 0;
        
        MySqlConnection con = new MySqlConnection(mConString);
        MySqlCommand cmd = new MySqlCommand();
        cmd.Connection = con;

        try
        {
            con.Open();
            cmd.CommandText = string.Concat("SELECT player2 FROM game WHERE id=", id);
            player2 = Convert.ToInt32(cmd.ExecuteScalar());
        }
        catch
        {
            
        }
        finally
        {
            con.Close();
        }

        return player2;
    }

    private ClientMessage UpdateGame(GameState state) 
    {
        ClientMessage msg = new ClientMessage();
        msg.error = "";

        MySqlConnection con = new MySqlConnection(mConString);
        MySqlCommand cmd = new MySqlCommand();
        cmd.Connection = con;
        cmd.Parameters.Add("?player1", MySqlDbType.Int32).Value = state.player1;
        cmd.Parameters.Add("?player2", MySqlDbType.Int32).Value = state.player2;
        cmd.Parameters.Add("?currentplayer", MySqlDbType.Int32).Value = state.currentPlayer;
        cmd.Parameters.Add("?b0", MySqlDbType.Int32).Value = state.b0;
        cmd.Parameters.Add("?b1", MySqlDbType.Int32).Value = state.b1;
        cmd.Parameters.Add("?b2", MySqlDbType.Int32).Value = state.b2;
        cmd.Parameters.Add("?b3", MySqlDbType.Int32).Value = state.b3;
        cmd.Parameters.Add("?b4", MySqlDbType.Int32).Value = state.b4;
        cmd.Parameters.Add("?b5", MySqlDbType.Int32).Value = state.b5;
        cmd.Parameters.Add("?b6", MySqlDbType.Int32).Value = state.b6;
        cmd.Parameters.Add("?b7", MySqlDbType.Int32).Value = state.b7;
        cmd.Parameters.Add("?b8", MySqlDbType.Int32).Value = state.b8;
        cmd.Parameters.Add("?status", MySqlDbType.Int32).Value = state.status;
        cmd.Parameters.Add("?winner", MySqlDbType.Int32).Value = state.winner;
        cmd.Parameters.Add("?id", MySqlDbType.Int32).Value = state.gameId;
        cmd.CommandText = "UPDATE game SET player1=?player1, player2=?player2, currentplayer=?currentplayer, b0=?b0, b1=?b1, b2=?b2, b3=?b3, b4=?b4, b5=?b5, b6=?b6, b7=?b7, b8=?b8, status=?status, winner=?winner WHERE id=?id";

        try
        {
            con.Open();
            cmd.ExecuteNonQuery();
        }
        catch (MySqlException e)
        {
            msg.error = e.Message;
        }
        catch (Exception e)
        {
            msg.error = e.Message;
        }
        finally
        {
            con.Close();
        }

        return msg;
    }

    private void SendResponse(ClientMessage msg)
    {
        JavaScriptSerializer js = new JavaScriptSerializer();
        Response.Write(js.Serialize(msg));
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
    }

    private class ClientMessage
    {
        public string status { get; set; }
        public string error { get; set; }
    }
}